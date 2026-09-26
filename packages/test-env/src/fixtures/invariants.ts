import {
  baseRegistrarV1Abi,
  ethRegistrarControllerV1Abi,
  publicResolverV1Abi,
} from "@ensforge/contracts/v1";
import {
  ethRegistrarV2Abi,
  ethRegistryV2Abi,
  permissionedResolverV2Abi,
  publicResolverV2Abi,
} from "@ensforge/contracts/v2";
import { isAddressEqual, labelhash, namehash } from "viem";

import type { DevnetEnvironment } from "../environment.js";
import type { EnsFixtureManifest } from "./manifest.js";

export const verifyFixtureManifest = async (
  environment: DevnetEnvironment,
  fixtures: EnsFixtureManifest,
): Promise<void> => {
  const [
    v1Owner,
    v2State,
    v1Email,
    v2Email,
    v1Approved,
    v2HasRole,
    v1CommitmentAt,
    v2CommitmentAt,
    reservedAddress,
    v2Contenthash,
    v2AbiJson,
    v2AbiZlibJson,
    v2AbiCbor,
    v2AbiUri,
    permissionedResolver,
    permissionedResolverHasRole,
  ] = await Promise.all([
    environment.clients.publicClient.readContract({
      abi: baseRegistrarV1Abi,
      address: environment.deployments.v1.contracts.baseRegistrar,
      functionName: "ownerOf",
      args: [BigInt(labelhash("v1-unwrapped"))],
    }),
    environment.clients.publicClient.readContract({
      abi: ethRegistryV2Abi,
      address: environment.deployments.v2.contracts.ethRegistry,
      functionName: "getState",
      args: [BigInt(labelhash("v2-active"))],
    }),
    environment.clients.publicClient.readContract({
      abi: publicResolverV1Abi,
      address: fixtures.records.v1.resolver,
      functionName: "text",
      args: [namehash(fixtures.records.v1.name), "email"],
    }),
    environment.clients.publicClient.readContract({
      abi: publicResolverV2Abi,
      address: fixtures.records.v2.resolver,
      functionName: "text",
      args: [namehash(fixtures.records.v2.name), "email"],
    }),
    environment.clients.publicClient.readContract({
      abi: baseRegistrarV1Abi,
      address: environment.deployments.v1.contracts.baseRegistrar,
      functionName: "getApproved",
      args: [fixtures.permissions.v1.tokenApproval.tokenId],
    }),
    environment.clients.publicClient.readContract({
      abi: ethRegistryV2Abi,
      address: environment.deployments.v2.contracts.ethRegistry,
      functionName: "hasRoles",
      args: [
        fixtures.permissions.v2.scopedRole.tokenId,
        fixtures.permissions.v2.scopedRole.role,
        fixtures.permissions.operator,
      ],
    }),
    environment.clients.publicClient.readContract({
      abi: ethRegistrarControllerV1Abi,
      address: fixtures.registration.v1.controller,
      functionName: "commitments",
      args: [fixtures.registration.v1.commitment],
    }),
    environment.clients.publicClient.readContract({
      abi: ethRegistrarV2Abi,
      address: fixtures.registration.v2.controller,
      functionName: "commitmentAt",
      args: [fixtures.registration.v2.commitment],
    }),
    environment.clients.publicClient.readContract({
      abi: publicResolverV1Abi,
      address: fixtures.records.reserved.resolver,
      functionName: "addr",
      args: [namehash(fixtures.records.reserved.name)],
    }),
    environment.clients.publicClient.readContract({
      abi: publicResolverV2Abi,
      address: fixtures.records.v2.resolver,
      functionName: "contenthash",
      args: [namehash(fixtures.records.v2.name)],
    }),
    environment.clients.publicClient.readContract({
      abi: publicResolverV2Abi,
      address: fixtures.records.v2.resolver,
      functionName: "ABI",
      args: [namehash(fixtures.records.v2.name), 1n],
    }),
    environment.clients.publicClient.readContract({
      abi: publicResolverV2Abi,
      address: fixtures.records.v2.resolver,
      functionName: "ABI",
      args: [namehash(fixtures.records.v2.name), 2n],
    }),
    environment.clients.publicClient.readContract({
      abi: publicResolverV2Abi,
      address: fixtures.records.v2.resolver,
      functionName: "ABI",
      args: [namehash(fixtures.records.v2.name), 4n],
    }),
    environment.clients.publicClient.readContract({
      abi: publicResolverV2Abi,
      address: fixtures.records.v2.resolver,
      functionName: "ABI",
      args: [namehash(fixtures.records.v2.name), 8n],
    }),
    environment.clients.publicClient.readContract({
      abi: ethRegistryV2Abi,
      address: environment.deployments.v2.contracts.ethRegistry,
      functionName: "getResolver",
      args: ["v2-write-ready"],
    }),
    environment.clients.publicClient.readContract({
      abi: permissionedResolverV2Abi,
      address: fixtures.permissions.v2.permissionedResolver.resolver,
      functionName: "hasRoles",
      args: [
        fixtures.permissions.v2.permissionedResolver.resource,
        fixtures.permissions.v2.permissionedResolver.role,
        fixtures.permissions.operator,
      ],
    }),
  ]);

  const checks = {
    v1Owner: !isAddressEqual(v1Owner, fixtures.v1.activeUnwrapped.owner),
    v2Owner: !isAddressEqual(v2State.latestOwner, fixtures.v2.active.owner),
    v1Email: v1Email !== fixtures.records.v1.texts.email,
    v2Email: v2Email !== fixtures.records.v2.texts.email,
    reservedAddress: !isAddressEqual(reservedAddress, fixtures.records.reserved.addresses.eth),
    v2Contenthash: v2Contenthash !== fixtures.records.v2.contenthash,
    v2AbiJsonType: v2AbiJson[0] !== fixtures.records.v2.abi.json.contentType,
    v2AbiJson: v2AbiJson[1] !== fixtures.records.v2.abi.json.raw,
    v2AbiZlibJsonType: v2AbiZlibJson[0] !== fixtures.records.v2.abi.zlibJson.contentType,
    v2AbiZlibJson: v2AbiZlibJson[1] !== fixtures.records.v2.abi.zlibJson.raw,
    v2AbiCborType: v2AbiCbor[0] !== fixtures.records.v2.abi.cbor.contentType,
    v2AbiCbor: v2AbiCbor[1] !== fixtures.records.v2.abi.cbor.raw,
    v2AbiUriType: v2AbiUri[0] !== fixtures.records.v2.abi.uri.contentType,
    v2AbiUri: v2AbiUri[1] !== fixtures.records.v2.abi.uri.raw,
    permissionedResolver: !isAddressEqual(
      permissionedResolver,
      fixtures.permissions.v2.permissionedResolver.resolver,
    ),
    permissionedResolverHasRole: !permissionedResolverHasRole,
    v1Approved: !isAddressEqual(v1Approved, fixtures.permissions.operator),
    v2HasRole: !v2HasRole,
    v1CommitmentAt: v1CommitmentAt === 0n,
    v2CommitmentAt: v2CommitmentAt === 0n,
  };
  const failures = Object.entries(checks)
    .filter(([, failed]) => failed)
    .map(([name]) => name);

  if (failures.length > 0) {
    throw new Error(`ENS fixture invariants failed: ${failures.join(", ")}`, {
      cause: {
        v1Approved,
        reservedAddress,
        v1CommitmentAt,
        v1Email,
        v1Owner,
        v2CommitmentAt,
        v2AbiCbor,
        v2AbiJson,
        v2AbiUri,
        v2AbiZlibJson,
        v2Contenthash,
        v2Email,
        v2HasRole,
        v2Owner: v2State.latestOwner,
        permissionedResolver,
        permissionedResolverHasRole,
      },
    });
  }
};
