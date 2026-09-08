import { Effect, Schema } from "effect";

import { isAddressEqual } from "viem";

import { defineAction } from "../../action/action.js";
import { defineReadAction } from "../../action/read-request.js";
import { HcaError } from "../../errors/hca-error.js";
import { provideConfig } from "../../internal/config/context.js";
import { viemErrorToEffectError } from "../../internal/errors/viem-error.js";
import { hcaRpc, resolveHcaProfile } from "../../internal/hca/context.js";
import { WriteClient } from "../../internal/write/write-client.js";
import { Hex } from "../../schemas/hex.js";
import { EthereumAddress } from "../../schemas/identity.js";
import type { WriteError } from "../../write/types.js";
import { fingerprintHcaCalls } from "./prepare.js";
import type {
  HcaExecutionStatus,
  HcaExecutionStatusParameters,
  WaitForHcaExecutionParameters,
} from "./types.js";

const hash = Hex.check(Schema.isPattern(/^0x[0-9a-fA-F]{64}$/));
const base = {
  chainId: Schema.Int,
  hca: EthereumAddress,
  profileId: Schema.String,
  planFingerprint: hash,
};
const submissionSchema = Schema.Union([
  Schema.Struct({ ...base, kind: Schema.Literal("transaction"), owner: EthereumAddress, hash }),
  Schema.Struct({
    ...base,
    kind: Schema.Literal("adapter"),
    adapterId: Schema.String,
    instanceId: Schema.String,
    reference: Schema.String,
    payload: Schema.Unknown,
  }),
]);

export const getHcaExecutionStatus = defineReadAction<
  HcaExecutionStatusParameters,
  HcaExecutionStatus,
  WriteError
>(
  Effect.fn("ensforge.getHcaExecutionStatus")(function* (config, parameters) {
    const { submission, execution } = parameters;
    if (!Schema.is(submissionSchema)(submission))
      return yield* new HcaError({
        code: "INVALID_PARAMETERS",
        message: "Invalid HCA submission handle",
      });
    const profile = yield* resolveHcaProfile(config);
    if (
      submission.chainId !== config.chainId ||
      submission.profileId !== profile.generation.id ||
      (yield* hcaRpc(() => config.publicClient.getChainId())) !== config.chainId
    )
      return yield* new HcaError({
        code: "ADAPTER_MISMATCH",
        message: "Submission belongs to a different network or account generation",
      });
    if (submission.kind === "adapter") {
      if (
        !execution ||
        execution.id !== submission.adapterId ||
        execution.instanceId !== submission.instanceId
      )
        return yield* new HcaError({
          code: "ADAPTER_MISMATCH",
          message: "Restore this submission with the same adapter configuration",
        });
      const result = yield* execution.getStatus.effect(config, submission);
      if (
        !Schema.is(
          Schema.Struct({
            status: Schema.Literals(["pending", "unknown", "succeeded", "failed"]),
            submission: submissionSchema,
          }),
        )(result)
      )
        return yield* new HcaError({
          code: "INVALID_EXECUTION",
          message: "Adapter returned an invalid execution status",
        });
      if (
        (result.status === "succeeded" || result.status === "failed") &&
        !Schema.is(
          Schema.Array(
            Schema.Struct({
              transactionHash: hash,
              blockNumber: Schema.BigInt,
              status: Schema.Literals(["success", "reverted"]),
            }),
          ),
        )(result.receipts)
      )
        return yield* new HcaError({
          code: "INVALID_EXECUTION",
          message: "Adapter returned invalid destination receipts",
        });
      if (
        result.submission.kind !== "adapter" ||
        result.submission.reference !== submission.reference ||
        result.submission.instanceId !== submission.instanceId ||
        result.submission.adapterId !== submission.adapterId ||
        result.submission.planFingerprint !== submission.planFingerprint ||
        result.submission.chainId !== submission.chainId ||
        !isAddressEqual(result.submission.hca, submission.hca)
      )
        return yield* new HcaError({
          code: "ADAPTER_MISMATCH",
          message: "Adapter returned status for another submission",
        });
      if (
        result.status === "succeeded" &&
        (result.receipts.length === 0 ||
          result.receipts.some((receipt) => receipt.status !== "success"))
      )
        return yield* new HcaError({
          code: "INVALID_EXECUTION",
          message: "Adapter success requires successful destination receipts",
        });
      return result;
    }
    if (execution)
      return yield* new HcaError({
        code: "ADAPTER_MISMATCH",
        message: "Direct wallet submissions do not use an execution adapter",
      });
    const receipt = yield* Effect.tryPromise({
      try: () => config.publicClient.getTransactionReceipt({ hash: submission.hash }),
      catch: (cause) => cause,
    }).pipe(
      Effect.catch((cause) =>
        Schema.is(Schema.Struct({ name: Schema.Literal("TransactionReceiptNotFoundError") }))(cause)
          ? Effect.succeed(null)
          : Effect.fail(viemErrorToEffectError(cause, "readContract")),
      ),
    );
    if (!receipt) return { status: "pending", submission };
    const transaction = yield* hcaRpc(() =>
      config.publicClient.getTransaction({ hash: receipt.transactionHash }),
    );
    const fingerprint = fingerprintHcaCalls(
      {
        chainId: config.chainId,
        address: submission.hca,
        owner: submission.owner,
        initialImplementation: profile.contracts.standaloneImplementation,
      },
      transaction.input,
      transaction.value,
    );
    if (
      !transaction.to ||
      !isAddressEqual(transaction.to, submission.hca) ||
      !isAddressEqual(transaction.from, submission.owner) ||
      fingerprint !== submission.planFingerprint
    )
      return yield* new HcaError({
        code: "INVALID_EXECUTION",
        message: "Transaction does not match the HCA submission",
      });
    return {
      status: receipt.status === "success" ? "succeeded" : "failed",
      submission,
      receipts: [receipt],
    };
  }),
);

const positive = Schema.Number.check(Schema.isFinite(), Schema.isGreaterThan(0));
export const waitForHcaExecution = defineAction<
  WaitForHcaExecutionParameters,
  HcaExecutionStatus,
  WriteError
>(
  Effect.fn("ensforge.waitForHcaExecution")(function* (config, parameters) {
    const policy = config.writes.confirmation;
    const timeout =
      parameters.timeout ?? (policy.type === "confirmed" ? policy.timeout : undefined) ?? 120_000;
    const confirmations =
      parameters.confirmations ??
      (policy.type === "confirmed" ? policy.confirmations : undefined) ??
      1;
    const pollingInterval = parameters.pollingInterval ?? 1_000;
    if (
      ![timeout, confirmations, pollingInterval].every(Schema.is(positive)) ||
      !Number.isInteger(confirmations)
    )
      return yield* new HcaError({
        code: "INVALID_PARAMETERS",
        message: "Wait options must be positive; confirmations must be an integer",
      });
    // Validate identity before waiting or invoking a provider.
    const initial = yield* getHcaExecutionStatus.effect(config, parameters);
    if (initial.status === "failed") return initial;
    if (parameters.submission.kind === "transaction") {
      const client = yield* provideConfig(config, WriteClient);
      yield* client.waitForReceipt(parameters.submission.hash, { confirmations, timeout });
      return yield* getHcaExecutionStatus.effect(config, parameters);
    }
    return yield* Effect.gen(function* () {
      while (true) {
        const status = yield* getHcaExecutionStatus.effect(config, parameters);
        if (status.status === "failed") return status;
        if (status.status === "succeeded") {
          const client = yield* provideConfig(config, WriteClient);
          for (const receipt of status.receipts)
            yield* client.waitForReceipt(receipt.transactionHash, { confirmations, timeout });
          return status;
        }
        yield* Effect.sleep(pollingInterval);
      }
    }).pipe(
      Effect.timeout(timeout),
      Effect.catchTag(
        "TimeoutError",
        () =>
          new HcaError({
            code: "INVALID_EXECUTION",
            message: "Execution wait timed out; retain the submission handle to resume",
          }),
      ),
    );
  }),
);
