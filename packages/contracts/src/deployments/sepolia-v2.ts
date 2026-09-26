import type { EnsV2Deployment } from "./types.js";

/** Sepolia ENSv2 beta snapshot linked by the ENS deployment documentation. */
export const sepoliaV2Deployment = {
  id: "sepolia-v2",
  chainId: 11155111,
  protocol: "v2",
  status: "beta",
  contracts: {
    universalResolver: "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe",
    universalHelper: "0x33f571aa8A160a21b877cF6E0Fb8806692b97DF5",
    rootRegistry: "0x9703DBD26dAB89504490994138cF2c575251a9cE",
    ethRegistry: "0x657eA849311d3D5823348ddEd7C2AaAFb3EDE09E",
    ethRegistrar: "0xAbe76F6C8DFcEd81AA5A2bB8034202A7136b94ca",
    rentPriceOracle: "0x9B0b9C65BDAf9794Ff7697E4dCFb1f50581072BB",
    ensV2Resolver: "0x9458eC65b4a703Ee1be03434879F35fd32b64704",
    publicResolver: "0xd7e590Ad0E92A6aC1d81f4483A9B951D3585a50F",
    verifiableFactory: "0x9e726Eb570beb6BCEb495AB8cdA7df517d4e841C",
    labelStore: "0x375C082021E677a40eA2AE094D050602dba90992",
    contractNamer: "0xDaB8b3dcb4C2BB181B9215b699b2C3E1fe180ae1",
    reverseRegistrarAdapter: "0x39993148CAA6a20aE1F08E1b2427966E97f85aaB",
    defaultReverseRegistrarAdapter: "0x4F32A1c62E202922d4d6307126F43218DB9dA6f5",
  },
  implementations: {
    universalResolver: "0x5d25C1D6aCBb71B7a28AA7899618a3412a8303e3",
    permissionedResolver: "0x14F09Fd05d4585759e54844DC9B00147131Cf243",
    userRegistry: "0xA80338aAA8D23831cEa25E858D1774534aBb0263",
    wrapperRegistry: "0x2741543c3B14640b97bC70a233318032f7E35bAC",
    contractNamer: "0x09146275aF44AB6BE7BE0bc50C16D450caE58237",
  },
  migration: {
    ensV1Resolver: "0xb2BF4a9A86d29661EA93223582b9945943931e42",
    ethRenewerV1: "0xd06e726e9bD8ac0f33A2a45F4Cc28fe10d656a36",
    unlockedMigrationController: "0x7ed171bb143a905F56105e4eA146543Ecb122F55",
    lockedMigrationController: "0xab1B57C6eE5E91e6090595c0AF14CB9B8bc7773f",
    migrationHelper: "0x58d12d60471b98F191856e4C2d56886e9c3eA573",
    graveyard: "0x950b93885b33cE4C7e8571BE2c88A1aa93D82F49",
    publicResolverSet: "0xd12aF6aC82648056Fe7D6B2a9dB97235Aa509021",
    registryUpgradeSet: "0xd8a8369477b67f837E2B1054b2d47F3D1956b543",
  },
  infrastructure: {
    managedUniversalResolverProxy: "0x6d80F2172CFdEc5730fE683860C33d26fC42e6F1",
    batchRegistrar: "0xBe68Ff9aFc7D5A1864ffef5C82DE0A1C13E6B529",
    rootBatchRegistrar: "0xCF5D485A531863856ED9D8A10D61707De7F06c21",
  },
  testTokens: {
    dai: "0x278053aCc97888E63Ec81c80FEC641Bf0Bf19664",
    usdc: "0x16f95D91DBa7dA3Aca778Ec053dF0FF6C6A8aA8e",
  },
  experimental: {
    hca: {
      ownerAndSessionValidator: "0x6A62Af42D4241a02547b096C7DB43ca6411AF813",
      upgradeSet: "0x2ceeDf92Fd032167c90936C9e6cA2931bd7Ec2c0",
      standaloneFactory: "0xB7CFeCEeD32DBa66c507b3c002dAD510b8399928",
      standaloneImplementation: "0xdF4a24c42921810fed9363b07292E9152578D706",
    },
  },
  provenance: {
    repository: "https://github.com/ensdomains/contracts-v2",
    ref: "71a3b7339dbc55ab47667abdfe8303bac4f4c24e",
    commit: "71a3b7339dbc55ab47667abdfe8303bac4f4c24e",
    documentation: "https://docs.ens.domains/learn/deployments/#sepolia-ensv2-beta",
  },
} as const satisfies EnsV2Deployment;
