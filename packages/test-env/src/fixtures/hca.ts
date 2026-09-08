import { Effect } from "effect";

import {
  standaloneHcaFactoryV2DeploymentAbi,
  standaloneHcaV2InspectionAbi,
  verifiableFactoryV2VerifyContractAbi,
} from "@ensforge/contracts/v2";
import { encodeAbiParameters, isAddressEqual, keccak256 } from "viem";

import { verifyHcaDeployment } from "../deployments/hca.js";
import type { DevnetEnvironment } from "../environment.js";
import { seedRead, seedTransaction } from "./contract.js";

export const seedHcaFixtures = Effect.fn("seedHcaFixtures")(function* (
  environment: DevnetEnvironment,
) {
  const profile = environment.deployments.hca;
  const wiring = yield* verifyHcaDeployment(environment.clients.publicClient, profile);
  const owner = environment.accounts.owner;
  const implementation = profile.contracts.standaloneImplementation;
  const salt = profile.generation.canonicalSalt;

  const request = {
    address: profile.contracts.standaloneFactory,
    abi: standaloneHcaFactoryV2DeploymentAbi,
    functionName: "deploy",
    args: [owner, implementation, salt],
  } as const;

  const address = yield* seedRead(async () => {
    const actualSalt = await environment.clients.publicClient.readContract({
      ...request,
      functionName: "deploymentSalt",
    });

    const expectedSalt = BigInt(
      keccak256(
        encodeAbiParameters(
          [{ type: "uint256" }, { type: "address" }, { type: "address" }],
          [salt, owner, implementation],
        ),
      ),
    );

    if (actualSalt !== expectedSalt) throw new Error("HCA factory salt derivation mismatch");

    const simulation = await environment.clients.publicClient.simulateContract({
      ...request,
      account: environment.accounts.deployer,
    });

    return simulation.result;
  }, "Unable to predict the owner-bound HCA fixture");

  yield* seedTransaction(environment, request, "Unable to deploy the owner-bound HCA fixture");
  yield* seedRead(async () => {
    const client = environment.clients.publicClient;
    const account = { address, abi: standaloneHcaV2InspectionAbi } as const;

    const [actualOwner, nonce] = await client.readContract({
      ...account,
      functionName: "ownerAndSessionNonce",
    });

    const certifiedOwner = await client.readContract({
      ...request,
      functionName: "authorizedOwnerOf",
      args: [address],
    });

    const actualImplementation = await client.readContract({
      ...account,
      functionName: "getImplementation",
    });

    const verifiedImplementation = await client.readContract({
      address: profile.deployment.contracts.verifiableFactory,
      abi: verifiableFactoryV2VerifyContractAbi,
      functionName: "verifyContract",
      args: [address],
    });

    if (
      !isAddressEqual(actualOwner, owner) ||
      !isAddressEqual(certifiedOwner, owner) ||
      nonce !== 0n ||
      !isAddressEqual(actualImplementation, implementation) ||
      !isAddressEqual(verifiedImplementation, implementation)
    ) {
      throw new Error(
        "Deployed HCA fixture does not match its owner, implementation or initial nonce",
      );
    }

    if (
      (await client.readContract({ ...account, functionName: "accountId" })) !==
      profile.generation.accountId
    )
      throw new Error("Deployed HCA account ID mismatch");
  }, "Unable to verify the deployed HCA fixture");

  return { address, owner, implementation, salt, wiring };
});
