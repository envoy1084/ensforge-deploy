import { Schema } from "effect";

import { EthereumAddress } from "../../schemas/identity.js";

const metadata = {
  status: Schema.optionalKey(Schema.Literals(["active", "beta", "legacy"])),
  provenance: Schema.optionalKey(
    Schema.Struct({
      repository: Schema.String,
      ref: Schema.String,
      commit: Schema.String,
      documentation: Schema.optionalKey(Schema.String),
    }),
  ),
};

const EnsV1ContractAddresses = Schema.Struct({
  registry: EthereumAddress,
  baseRegistrar: EthereumAddress,
  ethRegistrarController: EthereumAddress,
  wrappedEthRegistrarController: Schema.optionalKey(EthereumAddress),
  bulkRenewal: EthereumAddress,
  priceOracle: EthereumAddress,
  nameWrapper: EthereumAddress,
  publicResolver: EthereumAddress,
  universalResolver: EthereumAddress,
  reverseRegistrar: EthereumAddress,
  defaultReverseRegistrar: EthereumAddress,
  dnsRegistrar: EthereumAddress,
  dnssecOracle: EthereumAddress,
  offchainDnsResolver: EthereumAddress,
});

const EnsV2PublicContractAddresses = Schema.Struct({
  universalResolver: EthereumAddress,
  rootRegistry: EthereumAddress,
  ethRegistry: EthereumAddress,
  ethRegistrar: EthereumAddress,
  rentPriceOracle: EthereumAddress,
  ensV2Resolver: EthereumAddress,
  publicResolver: EthereumAddress,
  verifiableFactory: EthereumAddress,
  labelStore: EthereumAddress,
  contractNamer: EthereumAddress,
  reverseRegistrarAdapter: EthereumAddress,
  defaultReverseRegistrarAdapter: EthereumAddress,
});

const EnsV2ImplementationAddresses = Schema.Struct({
  universalResolver: EthereumAddress,
  permissionedResolver: EthereumAddress,
  userRegistry: EthereumAddress,
  wrapperRegistry: EthereumAddress,
  contractNamer: EthereumAddress,
});

const EnsV2MigrationContractAddresses = Schema.Struct({
  ensV1Resolver: EthereumAddress,
  ethRenewerV1: EthereumAddress,
  unlockedMigrationController: EthereumAddress,
  lockedMigrationController: EthereumAddress,
  migrationHelper: EthereumAddress,
  graveyard: EthereumAddress,
  publicResolverSet: EthereumAddress,
  registryUpgradeSet: EthereumAddress,
});

const EnsV2InfrastructureContractAddresses = Schema.Struct({
  managedUniversalResolverProxy: Schema.optionalKey(EthereumAddress),
  batchRegistrar: EthereumAddress,
  dnsV1MirrorRootBatchRegistrar: EthereumAddress,
});

const EnsV2ExperimentalHcaContractAddresses = Schema.Struct({
  ownerAndSessionValidator: EthereumAddress,
  upgradeGate: EthereumAddress,
  standaloneFactory: EthereumAddress,
  standaloneImplementation: EthereumAddress,
  trustedSet: EthereumAddress,
});

const EnsV2TestTokenAddresses = Schema.Struct({
  dai: EthereumAddress,
  usdc: EthereumAddress,
});

const v1 = Schema.Struct({
  ...metadata,
  contracts: EnsV1ContractAddresses,
});

const v2 = Schema.Struct({
  ...metadata,
  contracts: EnsV2PublicContractAddresses,
  implementations: EnsV2ImplementationAddresses,
  migration: EnsV2MigrationContractAddresses,
  infrastructure: EnsV2InfrastructureContractAddresses,
  experimental: Schema.optionalKey(Schema.Struct({ hca: EnsV2ExperimentalHcaContractAddresses })),
  testTokens: Schema.optionalKey(EnsV2TestTokenAddresses),
});

const identity = {
  id: Schema.String.pipe(Schema.check(Schema.isPattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/))),
  chainId: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(Number.MAX_SAFE_INTEGER)),
  ),
};

export const CustomEnsNetworkSchema = Schema.Union([
  Schema.Struct({
    ...identity,
    protocol: Schema.Literal("v1"),
    v1,
    v2: Schema.optionalKey(Schema.Never),
  }),
  Schema.Struct({ ...identity, protocol: Schema.Literal("v2"), v1: Schema.optionalKey(v1), v2 }),
]);
