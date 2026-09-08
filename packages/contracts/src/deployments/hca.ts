import type { Address } from "viem";

import { sepoliaV2Deployment } from "./sepolia-v2.js";
import type { EnsV2Deployment, EnsV2ExperimentalHcaContractAddresses } from "./types.js";

/** Account generation matched to the saved Sepolia compiler inputs, not branch-tip source. */
export const hcaAccountGeneration = {
  id: "ens-standalone-hca-1.1.0",
  accountId: "ens-standalone-hca.1.1.0",
  rhinestoneAccountVersion: "ens-standalone-1.1.0",
  artifactCommit: sepoliaV2Deployment.provenance.commit,
  sourceCommit: "09bf3ac64a6fb1b215573c019b17e8c501bb3ca0",
  canonicalSalt: 0n,
  entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  entryPointVersion: "0.7",
  initializers: "single-owner",
  capabilities: {
    immutableOwner: true,
    directOwnerExecution: true,
    fixedEnsSessions: true,
    moduleInstallation: false,
    delegatecall: false,
    providerCompatibilityVerified: false,
    crossChainFunding: false,
  },
} as const;

/** Source funding is a separate deployment boundary; no routes have been verified yet. */
export interface HcaSourceFundingManifest {
  readonly chainId: number;
  readonly validator: Address;
  readonly accountVersion: string;
  readonly artifactCommit: string;
  readonly status: "unverified";
}

export interface HcaDeploymentProfile {
  readonly generation: typeof hcaAccountGeneration;
  readonly deployment: EnsV2Deployment;
  readonly contracts: Omit<EnsV2ExperimentalHcaContractAddresses, "trustedSet">;
  readonly environment: "sepolia" | "devnet";
  readonly infrastructure: {
    readonly entryPoint: Address;
    readonly intentExecutor: Address;
    readonly gasRefundPaymaster: Address;
    readonly paymentToken: Address;
    readonly secondaryPaymentToken: Address;
  };
  readonly sourceFunding: readonly HcaSourceFundingManifest[];
}

/** Infrastructure values decoded from the deployment JSON's constructor argsData. */
export const sepoliaHcaDeployment = {
  generation: hcaAccountGeneration,
  deployment: sepoliaV2Deployment,
  contracts: {
    standaloneFactory: sepoliaV2Deployment.experimental.hca.standaloneFactory,
    standaloneImplementation: sepoliaV2Deployment.experimental.hca.standaloneImplementation,
    ownerAndSessionValidator: sepoliaV2Deployment.experimental.hca.ownerAndSessionValidator,
    upgradeGate: sepoliaV2Deployment.experimental.hca.upgradeGate,
  },
  environment: "sepolia",
  infrastructure: {
    entryPoint: hcaAccountGeneration.entryPoint,
    intentExecutor: "0x00000000005aD9ce1f5035FD62CA96CEf16AdAAF",
    gasRefundPaymaster: "0x1d7df6Ddc7328Ac827EB4D7f171C60AFB7f9A599",
    paymentToken: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    secondaryPaymentToken: sepoliaV2Deployment.testTokens.usdc,
  },
  sourceFunding: [],
} as const satisfies HcaDeploymentProfile;

/** Only Sepolia has a recorded public profile. Devnet profiles require local discovery. */
export const getHcaDeployment = (chainId: number): HcaDeploymentProfile => {
  if (chainId !== sepoliaHcaDeployment.deployment.chainId) {
    throw new RangeError(`No recorded HCA deployment for chain ${chainId}`);
  }
  return sepoliaHcaDeployment;
};
