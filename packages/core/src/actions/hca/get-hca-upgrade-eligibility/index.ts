import { Effect } from "effect";

import { standaloneHcaV2UpgradeAbi, hcaUpgradeGateV2ManagementAbi } from "@ensforge/contracts/v2";
import { zeroAddress, type Address } from "viem";

import { defineReadAction } from "../../../action/read-request.js";
import { hcaRpc, validateHcaAddress } from "../../../internal/hca/context.js";
import { withHcaSnapshot } from "../../../internal/hca/read.js";
import type { HcaUpgradeEligibility } from "../management-types.js";
import type { HcaErrorResult, HcaReadParameters } from "../types.js";
import { verifyHca } from "../verify-hca/index.js";

export const getHcaUpgradeEligibility = defineReadAction<
  HcaReadParameters & { readonly implementation: Address; readonly salt?: bigint },
  HcaUpgradeEligibility,
  HcaErrorResult
>((config, parameters) =>
  withHcaSnapshot(config, parameters, (_profile, blockNumber) =>
    Effect.gen(function* () {
      const implementation = yield* validateHcaAddress(parameters.implementation);
      const account = yield* verifyHca.effect(config, {
        hca: parameters.hca,
        ...(parameters.salt === undefined ? {} : { salt: parameters.salt }),
        blockNumber,
      });
      const currentGate = yield* hcaRpc(() =>
        config.publicClient.readContract({
          address: account.address,
          abi: standaloneHcaV2UpgradeAbi,
          functionName: "UPGRADE_GATE",
          blockNumber,
        }),
      );
      const targetApproved = yield* hcaRpc(() =>
        config.publicClient.readContract({
          address: currentGate,
          abi: hcaUpgradeGateV2ManagementAbi,
          functionName: "approvedImplementations",
          args: [implementation],
          blockNumber,
        }),
      );
      const base = {
        hca: account.address,
        implementation,
        currentImplementation: account.currentImplementation,
        currentGate,
        targetApproved,
        blockNumber,
      };
      const code = yield* hcaRpc(() =>
        config.publicClient.getCode({ address: implementation, blockNumber }),
      );

      if (!code || code === "0x")
        return {
          ...base,
          predecessorGate: zeroAddress,
          predecessorApproved: false,
          canUpgradeFrom: false,
          compatibleProxy: false,
          eligible: false,
        };

      const target = {
        address: implementation,
        abi: standaloneHcaV2UpgradeAbi,
        blockNumber,
      } as const;
      const predecessorGate = yield* hcaRpc(() =>
        config.publicClient.readContract({ ...target, functionName: "PREDECESSOR_UPGRADE_GATE" }),
      );
      const canUpgradeFrom = yield* hcaRpc(() =>
        config.publicClient.readContract({
          ...target,
          functionName: "canUpgradeFrom",
          args: [account.currentImplementation],
        }),
      );
      const uuid = yield* hcaRpc(() =>
        config.publicClient.readContract({ ...target, functionName: "proxiableUUID" }),
      );
      const compatibleProxy =
        uuid === "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const predecessorApproved =
        predecessorGate === zeroAddress
          ? false
          : yield* hcaRpc(() =>
              config.publicClient.readContract({
                address: predecessorGate,
                abi: hcaUpgradeGateV2ManagementAbi,
                functionName: "approvedImplementations",
                args: [account.currentImplementation],
                blockNumber,
              }),
            );

      return {
        ...base,
        predecessorGate,
        predecessorApproved,
        canUpgradeFrom,
        compatibleProxy,
        eligible:
          targetApproved &&
          predecessorApproved &&
          canUpgradeFrom &&
          compatibleProxy &&
          implementation.toLowerCase() !== account.currentImplementation.toLowerCase(),
      };
    }),
  ),
);
