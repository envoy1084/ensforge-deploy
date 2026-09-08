import {
  ethRegistrarV2CommitAbi,
  ethRegistrarV2RegisterAbi,
  permissionedResolverV2AuthorizeNameRolesAbi,
  permissionedResolverV2Abi,
  defaultReverseRegistrarAdapterV2Abi,
  enhancedAccessControlRoles,
} from "@ensforge/contracts/v2";
import { encodeFunctionData, erc20Abi, namehash } from "viem";

import type { HcaRegistrationOperation } from "../../../actions/hca/registration-types.js";
import type { HcaCall } from "../../../actions/hca/types.js";
import type { EnsforgeConfig } from "../../../config/config.js";

/** Register and grant resolver authority atomically, so the owner's name is never left unusable. */
export const registrationCalls = (
  config: EnsforgeConfig,
  operation: HcaRegistrationOperation,
  step: "commit" | "register",
  price: bigint,
): HcaCall[] => {
  const registration = operation.registration;

  if (step === "commit")
    return [
      {
        to: registration.registrar,
        data: encodeFunctionData({
          abi: ethRegistrarV2CommitAbi,
          functionName: "commit",
          args: [registration.commitment],
        }),
      },
    ];

  const calls: HcaCall[] = [
    // Reset first for tokens requiring zero allowance before changing a nonzero approval.
    {
      to: registration.paymentToken,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [registration.registrar, 0n],
      }),
    },
    {
      to: registration.paymentToken,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [registration.registrar, price],
      }),
    },
    {
      to: registration.registrar,
      data: encodeFunctionData({
        abi: ethRegistrarV2RegisterAbi,
        functionName: "register",
        args: [
          registration.name.slice(0, -4),
          operation.owner,
          registration.secret,
          registration.subregistry,
          registration.resolver,
          registration.duration,
          registration.paymentToken,
          registration.referrer,
        ],
      }),
    },
  ];

  if (registration.primaryName)
    calls.push({
      to: registration.resolver,
      data: encodeFunctionData({
        abi: permissionedResolverV2Abi,
        functionName: "setAddr",
        args: [namehash(registration.name), operation.owner],
      }),
    });

  calls.push({
    to: registration.resolver,
    data: encodeFunctionData({
      abi: permissionedResolverV2AuthorizeNameRolesAbi,
      functionName: "authorizeNameRoles",
      args: ["0x00", enhancedAccessControlRoles.allRoles, operation.owner, true],
    }),
  });

  if (registration.primaryName && config.deployments.protocol === "v2")
    calls.push({
      to: config.deployments.v2.contracts.defaultReverseRegistrarAdapter,
      data: encodeFunctionData({
        abi: defaultReverseRegistrarAdapterV2Abi,
        functionName: "setNameWithHCA",
        args: [operation.owner, registration.name],
      }),
    });

  return calls;
};
