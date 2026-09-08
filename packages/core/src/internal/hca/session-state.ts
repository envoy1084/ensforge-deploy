import { Effect, Schema } from "effect";

import { hcaValidatorV2SessionsAbi } from "@ensforge/contracts/v2";
import { getAbiItem, parseEventLogs, type Hex } from "viem";

import { HcaExecutionHash } from "../../actions/hca/execution-contract.js";
import type { VerifiedHcaAccount, VerifiedHcaSession } from "../../actions/hca/types.js";
import type { EnsforgeConfig } from "../../config/config.js";
import { HcaError } from "../../errors/hca-error.js";
import { hcaRpc, resolveHcaProfile } from "./context.js";

/** Receipt evidence avoids trusting caller-supplied signer, resolver or refund limits. */
export const readHcaSession = Effect.fn("readHcaSession")(function* (
  config: EnsforgeConfig,
  account: VerifiedHcaAccount,
  reference: { readonly permissionId: Hex; readonly enableTransactionHash: Hex },
) {
  if (
    !Schema.is(HcaExecutionHash)(reference.permissionId) ||
    !Schema.is(HcaExecutionHash)(reference.enableTransactionHash)
  )
    return yield* new HcaError({
      code: "INVALID_PARAMETERS",
      message: "Session requires a permission ID and confirmed enablement transaction hash",
    });

  const profile = yield* resolveHcaProfile(config);
  const validator = profile.contracts.ownerAndSessionValidator;
  const receipt = yield* hcaRpc(() =>
    config.publicClient.getTransactionReceipt({ hash: reference.enableTransactionHash }),
  );
  const block = yield* hcaRpc(() => config.publicClient.getBlock());
  const canonical = yield* hcaRpc(() =>
    config.publicClient.getBlock({ blockNumber: receipt.blockNumber }),
  );

  if (receipt.status !== "success" || canonical.hash !== receipt.blockHash)
    return yield* new HcaError({
      code: "INVALID_EXECUTION",
      message: "Session enablement receipt is not canonical and successful",
    });

  const logs = receipt.logs.filter((log) => log.address.toLowerCase() === validator.toLowerCase());
  const enabledEvents = parseEventLogs({
    abi: hcaValidatorV2SessionsAbi,
    eventName: "SessionEnabled",
    logs,
  });
  let enabled: (typeof enabledEvents)[number] | undefined;
  for (const event of enabledEvents) {
    if (
      event.args.account.toLowerCase() === account.address.toLowerCase() &&
      event.args.permissionId.toLowerCase() === reference.permissionId.toLowerCase()
    )
      enabled = event;
  }

  if (
    !enabled ||
    enabled.args.sessionNonce !== account.sessionNonce ||
    BigInt(enabled.args.validUntil) < block.timestamp
  )
    return yield* new HcaError({
      code: "INVALID_EXECUTION",
      message: "Session is missing, expired or revoked",
    });

  // A permission ID may be re-enabled with different settings. Reject stale receipts.
  const later = yield* hcaRpc(() =>
    config.publicClient.getLogs({
      address: validator,
      event: getAbiItem({ abi: hcaValidatorV2SessionsAbi, name: "SessionEnabled" }),
      args: { account: account.address, permissionId: reference.permissionId },
      fromBlock: receipt.blockNumber,
      toBlock: block.number,
    }),
  );

  if (
    later.some(
      (log) =>
        log.blockNumber !== null &&
        (log.blockNumber > receipt.blockNumber ||
          (log.blockNumber === receipt.blockNumber &&
            log.logIndex !== null &&
            enabled.logIndex !== null &&
            log.logIndex > enabled.logIndex)),
    )
  )
    return yield* new HcaError({
      code: "INVALID_EXECUTION",
      message: "Session was re-enabled; use its latest enablement transaction",
    });

  const usable = yield* hcaRpc(() =>
    config.publicClient.readContract({
      address: validator,
      abi: hcaValidatorV2SessionsAbi,
      functionName: "isPermissionEnabled",
      args: [account.address, reference.permissionId],
      blockNumber: block.number,
    }),
  );

  if (!usable)
    return yield* new HcaError({ code: "INVALID_EXECUTION", message: "Session is not enabled" });

  const refundEvent = parseEventLogs({
    abi: hcaValidatorV2SessionsAbi,
    eventName: "SessionRefundConfigured",
    logs,
  }).find(
    (log) =>
      log.args.account.toLowerCase() === account.address.toLowerCase() &&
      log.args.permissionId.toLowerCase() === reference.permissionId.toLowerCase() &&
      log.logIndex !== null &&
      enabled.logIndex !== null &&
      log.logIndex === enabled.logIndex + 1,
  );

  return Object.freeze({
    permissionId: reference.permissionId,
    enableTransactionHash: reference.enableTransactionHash,
    sessionKey: enabled.args.sessionKey,
    resolver: enabled.args.resolver,
    validUntil: enabled.args.validUntil,
    sessionNonce: enabled.args.sessionNonce,
    ...(refundEvent === undefined
      ? {}
      : {
          refund: Object.freeze({
            token: refundEvent.args.token,
            maxExchangeRate: refundEvent.args.maxExchangeRate,
            maxGasOverhead: BigInt(refundEvent.args.maxGasOverhead),
            maxAmount: refundEvent.args.maxRefundAmount,
          }),
        }),
  }) satisfies VerifiedHcaSession;
});
