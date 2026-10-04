import type { EnsV2Deployment } from "./types.js";

/** Sepolia ENSv2 October 1, 2026 snapshot linked by the ENS deployment documentation. */
export const sepoliaV2Deployment = {
  id: "sepolia-v2",
  chainId: 11155111,
  protocol: "v2",
  status: "active",
  contracts: {
    universalResolver: "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe",
    universalHelper: "0xd453e5bdb62cc3bea84341b1e306319c8ffd7dfe",
    rootRegistry: "0xb458d6a3a77919449d03e7a6903c26827c1ec43f",
    ethRegistry: "0xd4ebcbbdf463c9c45784603db0ddd499bc44a8b4",
    ethRegistrar: "0xf633e7fc17e2bbe0d0965d18ec1821dcb754a3d3",
    rentPriceOracle: "0x8196665d4ca7488b6474a9ec8e7d2719fb42263a",
    ensV2Resolver: "0x1cf3989ed3e5ec3cb1d731fc3777323813b61acf",
    publicResolver: "0xdc4a563d00f5c3012b699794eb9e13a561be386f",
    verifiableFactory: "0xda70306c98e97ece36f997a21368e53298572991",
    labelStore: "0xed8246ff02203a4d4cb262bd78beaa7408a57cae",
    contractNamer: "0x606f2453484f4fa85b6e5fdb0e0bf777064bf9f3",
    reverseRegistrarAdapter: "0x56bce5e727faa9d237341bb5b9e8a03d5919779d",
    defaultReverseRegistrarAdapter: "0x36f97328e843e37520cbf530e9402791c2754066",
  },
  implementations: {
    universalResolver: "0x24e1d8e068620b647ca097f961a61055f4f42d72",
    permissionedResolver: "0x115eb53f0c60696633855f90b138178fb40b2b2c",
    userRegistry: "0x9bd8a88719068d09ecee662f36c0e3856708366a",
    wrapperRegistry: "0xbe768b63e5fbbfbb0ae97e9064e0002df8001880",
    contractNamer: "0x4b8263be7c522d8fb3fbca1f74b9c6e083b8d3e4",
  },
  migration: {
    ensV1Resolver: "0x322b7581ca210a69c6d0e0d7c88a7688d2789cb0",
    ethRenewerV1: "0xf2ece44980778966b8a0fccb3a9e339440f6e045",
    unlockedMigrationController: "0x2a35b94df22cc7354570be2284655e2cdc0e64a2",
    lockedMigrationController: "0x6029a063d69b09d23c52a754a90e4fe43adac3a8",
    migrationHelper: "0xa8f86ee5cdd28703bd876f3a8c10b1de70f36899",
    graveyard: "0xb58a90a39d13cce1d0e192b5da5c47640855b04d",
    publicResolverSet: "0x5b2bd5208dac31905106d8e5a4973ae1cd7414f2",
    registryUpgradeSet: "0xf0a6f68c28603bdf2881ca17476ee477c72cd2fe",
  },
  infrastructure: {
    ensUriRenderer: "0x4d7f0349dffb8e7bed9ffba1b9e45f7ecbd4f0f8",
    boxedEnsUriRenderer: "0x0f5b101b6fc626b9b210bb5e70f60f3dd9ca0d96",
    managedUniversalResolverProxy: "0x6d80F2172CFdEc5730fE683860C33d26fC42e6F1",
    batchRegistrar: "0x4a4c8b7cdab6b19dc2cdb417cdb53a2ccbaf5322",
    rootBatchRegistrar: "0x4cdedc6b514a6bc9b64854dfe2d6849d5b1369a6",
  },
  testTokens: {
    dai: "0xf6fac8a58a0be13b9197f27c41b73162fe32572b",
    usdc: "0x240b0316df57887dbbe58b586508b19e633a14aa",
  },
  experimental: {
    hca: {
      ownerAndSessionValidator: "0x4bf641590ab18e31b9f8789a3417a2620f860466",
      upgradeSet: "0xcde956d6e2949bc25a4273f93e0db6f68a1a6f34",
      standaloneFactory: "0x6bad0176236e97b346b5dd13bcc8325b931ee8ab",
      standaloneImplementation: "0xc940e5c5bf263c0e097054aecf73826769a72cee",
    },
  },
  provenance: {
    repository: "https://github.com/ensdomains/contracts-v2",
    ref: "07e55a056f5b6a9c90119f501bdd05714e67dddd",
    commit: "07e55a056f5b6a9c90119f501bdd05714e67dddd",
    documentation: "https://docs.ens.domains/learn/deployments/#sepolia-ensv2",
  },
} as const satisfies EnsV2Deployment;
