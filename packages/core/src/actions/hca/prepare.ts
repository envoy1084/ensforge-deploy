import { Effect, Schema } from "effect";

import { standaloneHcaV2ExecuteByOwnerAbi } from "@ensforge/contracts/v2";
import { encodeAbiParameters, encodeFunctionData, isAddressEqual, keccak256 } from "viem";

import { defineAction } from "../../action/action.js";
import { getWriteIntentPreparer } from "../../action/write-intent.js";
import type { EnsWriteIntent } from "../../action/write-intent.js";
import { HcaError } from "../../errors/hca-error.js";
import { executeRead } from "../../internal/read/execute-read.js";
import { prepareWriteIntents } from "../../internal/write/prepare-write-intents.js";
import type { WriteError } from "../../write/types.js";
import { verifyHca } from "./reads.js";
import {
  HcaCall,
  type PrepareHcaCallsParameters,
  type PreparedHcaCalls,
  type VerifiedHcaAccount,
} from "./types.js";

export const fingerprintHcaCalls = (
  account: Pick<VerifiedHcaAccount, "chainId" | "address" | "owner" | "initialImplementation">,
  data: `0x${string}`,
  value: bigint,
) =>
  keccak256(
    encodeAbiParameters(
      [
        { type: "uint256" },
        { type: "address" },
        { type: "address" },
        { type: "address" },
        { type: "bytes" },
        { type: "uint256" },
      ],
      [
        BigInt(account.chainId),
        account.address,
        account.owner,
        account.initialImplementation,
        data,
        value,
      ],
    ),
  );

export const prepareHcaCalls = defineAction<
  PrepareHcaCallsParameters,
  PreparedHcaCalls,
  WriteError
>((config, parameters) =>
  executeRead(
    config,
    { consistency: "snapshot" },
    Effect.gen(function* () {
      if (parameters.authorization?.kind !== "owner")
        return yield* new HcaError({
          code: "UNSUPPORTED_AUTHORIZATION",
          message:
            "P1 supports owner authorization only; destination sessions require validated policy preparation",
        });
      if (!Array.isArray(parameters.calls) || parameters.calls.length === 0)
        return yield* new HcaError({
          code: "INVALID_PARAMETERS",
          message: "An HCA batch must contain at least one call",
        });
      const account = yield* verifyHca.effect(config, {
        hca: parameters.hca,
        ...(parameters.salt === undefined ? {} : { salt: parameters.salt }),
      });
      const calls = yield* Effect.forEach(parameters.calls, (input) =>
        Effect.gen(function* () {
          if (Schema.is(HcaCall)(input)) {
            return { to: input.to, data: input.data ?? ("0x" as const), value: input.value ?? 0n };
          }
          const intent = input as EnsWriteIntent<unknown, WriteError>;
          if (!input || typeof input !== "object" || getWriteIntentPreparer(intent) === undefined)
            return yield* new HcaError({
              code: "INVALID_PARAMETERS",
              message: "Expected a validated raw call or an ENS .call intent",
            });
          const [prepared] = yield* prepareWriteIntents(config, {
            calls: [intent],
            account: account.address,
            ...(parameters.walletClient === undefined
              ? {}
              : { walletClient: parameters.walletClient }),
          });
          if (!prepared)
            return yield* new HcaError({
              code: "INVALID_EXECUTION",
              message: "ENS intent produced no HCA call",
            });
          return { to: prepared.to, data: prepared.data ?? ("0x" as const), value: prepared.value };
        }),
      );
      if (calls.some((call) => isAddressEqual(call.to, account.address)))
        return yield* new HcaError({
          code: "INVALID_EXECUTION",
          message: "HCA self-calls require dedicated validated management actions",
        });
      const value = calls.reduce((sum, call) => sum + call.value, 0n);
      if (value >= 1n << 256n)
        return yield* new HcaError({
          code: "INVALID_PARAMETERS",
          message: "HCA batch value exceeds uint256",
        });
      const data = encodeFunctionData({
        abi: standaloneHcaV2ExecuteByOwnerAbi,
        functionName: "executeByOwner",
        args: [calls.map((call) => ({ target: call.to, value: call.value, callData: call.data }))],
      });
      return Object.freeze({
        account,
        authorization: Object.freeze({ kind: "owner" as const }),
        calls: Object.freeze(calls.map((call) => Object.freeze(call))),
        data,
        value,
        fingerprint: fingerprintHcaCalls(account, data, value),
        simulation: "required" as const,
      });
    }),
  ),
);
