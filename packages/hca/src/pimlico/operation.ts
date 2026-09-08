import { getUserOperationHash, type UserOperation } from "viem/account-abstraction";

import type { PimlicoOptions } from "./types.js";

export const hashOperation = (options: PimlicoOptions, userOperation: UserOperation<"0.7">) =>
  getUserOperationHash({
    userOperation,
    entryPointAddress: options.profile.infrastructure.entryPoint,
    entryPointVersion: "0.7",
    chainId: options.chain.id,
  });
