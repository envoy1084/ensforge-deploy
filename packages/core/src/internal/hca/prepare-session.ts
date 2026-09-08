import { Effect, Schema } from "effect";

import { hcaValidatorV2SessionsAbi } from "@ensforge/contracts/v2";
import { encodeFunctionData, isAddressEqual, type Hex } from "viem";

import { type EnsWriteIntentPreparer } from "../../action/write-intent.js";
import type { EnableHcaSessionWithRefundParameters } from "../../actions/hca/enable-hca-session-with-refund/types.js";
import type { EnableHcaSessionParameters } from "../../actions/hca/enable-hca-session/types.js";
import { HcaExecutionHash } from "../../actions/hca/execution-contract.js";
import { verifyHca } from "../../actions/hca/verify-hca/index.js";
import { HcaError } from "../../errors/hca-error.js";
import type { WriteError } from "../../write/types.js";
import { hcaRpc, resolveHcaProfile, validateHcaAddress } from "./context.js";

const uint = (value: unknown, bits: number, positive: boolean) =>
  typeof value === "bigint" && value >= (positive ? 1n : 0n) && value < 1n << BigInt(bits);

export const prepareHcaSession: EnsWriteIntentPreparer<
  EnableHcaSessionParameters | EnableHcaSessionWithRefundParameters,
  WriteError
> = Effect.fn("prepareHcaSession")(function* (config, parameters, context) {
  const profile = yield* resolveHcaProfile(config);
  const account = yield* verifyHca.effect(config, parameters);
  const sender = typeof context.account === "string" ? context.account : context.account.address;

  // The validator records msg.sender as the session account, so enablement must come from the HCA.
  if (!isAddressEqual(sender, account.address))
    return yield* new HcaError({
      code: "INVALID_EXECUTION",
      message: "Session enablement intents must execute through their HCA",
    });

  yield* validateHcaAddress(parameters.sessionKey);
  yield* validateHcaAddress(parameters.resolver);
  const block = yield* hcaRpc(() => config.publicClient.getBlock());

  if (
    !Schema.is(HcaExecutionHash)(parameters.permissionId) ||
    !Number.isSafeInteger(parameters.validUntil) ||
    parameters.validUntil >= 2 ** 48 ||
    BigInt(parameters.validUntil) <= block.timestamp
  )
    return yield* new HcaError({
      code: "INVALID_PARAMETERS",
      message: "Expected bytes32 permission ID and a future uint48 session expiry",
    });

  const args = [
    parameters.permissionId,
    parameters.sessionKey,
    parameters.validUntil,
    parameters.resolver,
  ] as const;
  let data: Hex;

  if ("refund" in parameters) {
    const refund = parameters.refund;

    if (
      !refund ||
      typeof refund.token !== "string" ||
      ![profile.infrastructure.paymentToken, profile.infrastructure.secondaryPaymentToken].some(
        (token) => token.toLowerCase() === refund.token?.toLowerCase(),
      ) ||
      !uint(refund.maxExchangeRate, 96, true) ||
      !uint(refund.maxGasOverhead, 48, false) ||
      !uint(refund.maxAmount, 96, true)
    )
      return yield* new HcaError({
        code: "INVALID_PARAMETERS",
        message:
          "Refund requires a supported payment token and bounded uint96 rate/amount and uint48 overhead",
      });

    data = encodeFunctionData({
      abi: hcaValidatorV2SessionsAbi,
      functionName: "enableSessionWithRefund",
      args: [
        ...args,
        refund.token,
        refund.maxExchangeRate,
        Number(refund.maxGasOverhead),
        refund.maxAmount,
      ],
    });
  } else {
    data = encodeFunctionData({
      abi: hcaValidatorV2SessionsAbi,
      functionName: "enableSession",
      args,
    });
  }

  return {
    to: profile.contracts.ownerAndSessionValidator,
    data,
    value: 0n,
    protocol: "v2" as const,
  };
});
