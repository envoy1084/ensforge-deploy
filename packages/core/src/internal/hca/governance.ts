import { Effect } from "effect";

import type { HcaDeploymentProfile } from "@ensforge/contracts/deployments";
import { hcaUpgradeGateV2ManagementAbi } from "@ensforge/contracts/v2";

import type { HcaGovernanceTarget } from "../../actions/hca/admin/types.js";
import type { EnsforgeConfig } from "../../config/config.js";
import { HcaError } from "../../errors/hca-error.js";
import { hcaRpc, validateHcaAddress } from "./context.js";

export const readHcaGovernanceTarget = Effect.fn("readHcaGovernanceTarget")(function* (
  config: EnsforgeConfig,
  profile: HcaDeploymentProfile,
  target: HcaGovernanceTarget,
  blockNumber?: bigint,
) {
  if (target.kind !== "factory" && target.kind !== "upgradeGate")
    return yield* new HcaError({
      code: "INVALID_PARAMETERS",
      message: "Select the factory or an explicit upgrade gate",
    });

  const address = yield* validateHcaAddress(
    target.kind === "factory"
      ? profile.contracts.standaloneFactory
      : (target.address ?? profile.contracts.upgradeGate),
  );
  const owner = yield* hcaRpc(() =>
    config.publicClient.readContract({
      address,
      abi: hcaUpgradeGateV2ManagementAbi,
      functionName: "owner",
      ...(blockNumber === undefined ? {} : { blockNumber }),
    }),
  );

  return { address, owner };
});
