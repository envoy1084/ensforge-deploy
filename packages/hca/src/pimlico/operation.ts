import { Effect } from "effect";

import { HcaError } from "@ensforge/core";
import { getUserOperationHash, type UserOperation } from "viem/account-abstraction";

import type { PimlicoOptions } from "./types.js";

export const pimlicoCall = <A>(operation: () => Promise<A>) =>
  Effect.tryPromise({
    try: operation,
    catch: (cause) =>
      cause instanceof HcaError
        ? cause
        : new HcaError({ code: "ADAPTER_FAILED", message: "Pimlico operation failed", cause }),
  });

export const hashOperation = (options: PimlicoOptions, userOperation: UserOperation<"0.7">) =>
  getUserOperationHash({
    userOperation,
    entryPointAddress: options.profile.infrastructure.entryPoint,
    entryPointVersion: "0.7",
    chainId: options.chain.id,
  });

/** EntryPoint charges the maximum configured gas allocation at no more than maxFeePerGas. */
export const maximumGasCost = (operation: UserOperation<"0.7">) =>
  (operation.preVerificationGas +
    operation.verificationGasLimit +
    operation.callGasLimit +
    (operation.paymasterVerificationGasLimit ?? 0n) +
    (operation.paymasterPostOpGasLimit ?? 0n)) *
  operation.maxFeePerGas;
