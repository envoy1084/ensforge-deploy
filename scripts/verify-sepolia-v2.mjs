#!/usr/bin/env node
/* eslint-disable no-await-in-loop -- Keep artifact and RPC requests sequential to avoid rate limits. */
import assert from "node:assert/strict";

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

import { sepoliaV2Deployment as deployment } from "../packages/contracts/dist/deployments.js";
import * as contracts from "../packages/contracts/dist/v2.js";
import * as hca from "../packages/contracts/dist/v2/experimental/hca.js";

// Read-only: compare recorded addresses and critical ABIs with the pinned deployment artifacts.
const client = createPublicClient({
  chain: sepolia,
  transport: http(
    process.env.ENSFORGE_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
  ),
});
assert.equal(await client.getChainId(), sepolia.id, "Expected a Sepolia RPC");
const blockNumber = await client.getBlockNumber();
const entries = [
  ["UpgradableUniversalResolverProxy", deployment.contracts.universalResolver],
  ["UniversalHelper", deployment.contracts.universalHelper],
  ["RootRegistry", deployment.contracts.rootRegistry],
  ["ETHRegistry", deployment.contracts.ethRegistry],
  ["ETHRegistrar", deployment.contracts.ethRegistrar],
  ["StandardRentPriceOracle", deployment.contracts.rentPriceOracle],
  ["ENSV2Resolver", deployment.contracts.ensV2Resolver],
  ["PublicResolverV2", deployment.contracts.publicResolver],
  ["VerifiableFactory", deployment.contracts.verifiableFactory],
  ["LabelStore", deployment.contracts.labelStore],
  ["ContractNamer", deployment.contracts.contractNamer],
  ["ReverseRegistrarAdapter", deployment.contracts.reverseRegistrarAdapter],
  ["DefaultReverseRegistrarAdapter", deployment.contracts.defaultReverseRegistrarAdapter],
  ["UniversalResolverV2", deployment.implementations.universalResolver],
  ["PermissionedResolverImpl", deployment.implementations.permissionedResolver],
  ["UserRegistryImpl", deployment.implementations.userRegistry],
  ["WrapperRegistryImpl", deployment.implementations.wrapperRegistry],
  ["ContractNamer_Implementation", deployment.implementations.contractNamer],
  ["ENSV1Resolver", deployment.migration.ensV1Resolver],
  ["ETHRenewerV1", deployment.migration.ethRenewerV1],
  ["UnlockedMigrationController", deployment.migration.unlockedMigrationController],
  ["LockedMigrationController", deployment.migration.lockedMigrationController],
  ["MigrationHelper", deployment.migration.migrationHelper],
  ["Graveyard", deployment.migration.graveyard],
  ["PublicResolverSet", deployment.migration.publicResolverSet],
  ["RegistryUpgradeSet", deployment.migration.registryUpgradeSet],
  ["ManagedUniversalResolverProxy", deployment.infrastructure.managedUniversalResolverProxy],
  ["BatchRegistrar", deployment.infrastructure.batchRegistrar],
  ["RootBatchRegistrar", deployment.infrastructure.rootBatchRegistrar],
  ["MockDAI", deployment.testTokens.dai],
  ["MockUSDC", deployment.testTokens.usdc],
  ["HCAOwnerAndSessionValidator", deployment.experimental.hca.ownerAndSessionValidator],
  ["HCAUpgradeSet", deployment.experimental.hca.upgradeSet],
  ["StandaloneHCAFactory", deployment.experimental.hca.standaloneFactory],
  ["StandaloneHCAImplementation", deployment.experimental.hca.standaloneImplementation],
];
const abis = {
  ETHRegistrar: contracts.ethRegistrarV2Abi,
  ETHRenewerV1: contracts.ethRenewerV1Abi,
  PermissionedResolverImpl: contracts.permissionedResolverV2Abi,
  PublicResolverV2: contracts.publicResolverV2Abi,
  ETHRegistry: contracts.ethRegistryV2Abi,
  UserRegistryImpl: contracts.userRegistryV2Abi,
  WrapperRegistryImpl: contracts.wrapperRegistryV2Abi,
  UniversalHelper: contracts.universalHelperV2Abi,
  UniversalResolverV2: contracts.universalResolverV2Abi,
  StandaloneHCAFactory: hca.standaloneHcaFactoryV2Abi,
  StandaloneHCAImplementation: hca.standaloneSingleOwnerHcaV2Abi,
  HCAOwnerAndSessionValidator: hca.hcaOwnerAndSessionValidatorV2Abi,
  HCAUpgradeSet: hca.hcaUpgradeSetV2Abi,
};
for (const [name, address] of entries) {
  const response = await fetch(
    `https://raw.githubusercontent.com/ensdomains/contracts-v2/${deployment.provenance.commit}/contracts/deployments/sepolia/${name}.json`,
  );
  assert.ok(response.ok, `Unable to fetch artifact: ${name}`);
  const artifact = await response.json();
  assert.equal(address.toLowerCase(), artifact.address.toLowerCase(), `Address mismatch: ${name}`);
  if (name in abis) assert.deepEqual(abis[name], artifact.abi, `ABI mismatch: ${name}`);
  const code = await client.getCode({ address, blockNumber });
  assert.ok(code && code !== "0x", `No code at ${name}`);
}
process.stdout.write(
  `Verified ${entries.length} deployment addresses and ${Object.keys(abis).length} ABIs at Sepolia block ${blockNumber}.\n`,
);
