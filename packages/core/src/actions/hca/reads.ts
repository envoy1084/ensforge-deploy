import { Effect } from "effect";

import {
  standaloneHcaFactoryV2DeploymentAbi,
  standaloneHcaV2InspectionAbi,
  verifiableFactoryV2ProxyLogicAbi,
  verifiableFactoryV2VerifyContractAbi,
} from "@ensforge/contracts/v2";
import { isAddressEqual, zeroAddress, type Address } from "viem";

import type { BlockParameters } from "../../action/block.js";
import { defineReadAction } from "../../action/read-request.js";
import { HcaError } from "../../errors/hca-error.js";
import { hcaRpc, validateHcaAddress, validateHcaSalt } from "../../internal/hca/context.js";
import { deriveHcaAddress } from "../../internal/hca/derive.js";
import { withHcaSnapshot } from "../../internal/hca/read.js";
import { verifyHcaDeployment } from "../../internal/hca/verify-deployment.js";
import type {
  HcaDerivationParameters,
  HcaErrorResult,
  HcaReadParameters,
  HcaState,
  VerifiedHcaAccount,
  VerifyHcaParameters,
} from "./types.js";

export const predictHcaAddress = defineReadAction<HcaDerivationParameters, Address, HcaErrorResult>(
  (config, parameters) =>
    withHcaSnapshot(config, parameters, (profile, blockNumber) =>
      Effect.gen(function* () {
        const owner = yield* validateHcaAddress(parameters.owner);

        const implementation = yield* validateHcaAddress(
          parameters.implementation ?? profile.contracts.standaloneImplementation,
        );

        const salt = yield* validateHcaSalt(parameters.salt ?? profile.generation.canonicalSalt);

        const proxyLogic = yield* hcaRpc(() =>
          config.publicClient.readContract({
            address: profile.deployment.contracts.verifiableFactory,
            abi: verifiableFactoryV2ProxyLogicAbi,
            functionName: "proxyLogic",
            blockNumber,
          }),
        );

        return deriveHcaAddress(
          owner,
          implementation,
          salt,
          profile.contracts.standaloneFactory,
          profile.deployment.contracts.verifiableFactory,
          proxyLogic,
        );
      }),
    ),
);

export const getHca = defineReadAction<HcaReadParameters, HcaState, HcaErrorResult>(
  (config, parameters) =>
    withHcaSnapshot(config, parameters, (_profile, blockNumber) =>
      Effect.gen(function* () {
        const address = yield* validateHcaAddress(parameters.hca);
        const code = yield* hcaRpc(() => config.publicClient.getCode({ address, blockNumber }));

        if (!code || code === "0x")
          return { status: "undeployed" as const, address, chainId: config.chainId, blockNumber };

        const request = { address, abi: standaloneHcaV2InspectionAbi, blockNumber } as const;

        const [owner, sessionNonce] = yield* hcaRpc(() =>
          config.publicClient.readContract({ ...request, functionName: "ownerAndSessionNonce" }),
        );

        const implementation = yield* hcaRpc(() =>
          config.publicClient.readContract({ ...request, functionName: "getImplementation" }),
        );

        const accountId = yield* hcaRpc(() =>
          config.publicClient.readContract({ ...request, functionName: "accountId" }),
        );

        return {
          status: "deployed" as const,
          address,
          chainId: config.chainId,
          owner,
          sessionNonce,
          implementation,
          accountId,
          blockNumber,
        };
      }),
    ),
);

export const getHcaOwner = defineReadAction<HcaReadParameters, Address | null, HcaErrorResult>(
  (config, parameters) =>
    getHca
      .effect(config, parameters)
      .pipe(Effect.map((state) => (state.status === "deployed" ? state.owner : null))),
);

export const getHcaImplementation = defineReadAction<
  HcaReadParameters,
  Address | null,
  HcaErrorResult
>((config, parameters) =>
  getHca
    .effect(config, parameters)
    .pipe(Effect.map((state) => (state.status === "deployed" ? state.implementation : null))),
);

export const getHcaAccountId = defineReadAction<HcaReadParameters, string | null, HcaErrorResult>(
  (config, parameters) =>
    getHca
      .effect(config, parameters)
      .pipe(Effect.map((state) => (state.status === "deployed" ? state.accountId : null))),
);

export const getHcaSessionNonce = defineReadAction<
  HcaReadParameters,
  bigint | null,
  HcaErrorResult
>((config, parameters) =>
  getHca
    .effect(config, parameters)
    .pipe(Effect.map((state) => (state.status === "deployed" ? state.sessionNonce : null))),
);

export const getAuthorizedHcaOwner = defineReadAction<
  HcaReadParameters,
  Address | null,
  HcaErrorResult
>((config, parameters) =>
  withHcaSnapshot(config, parameters, (profile, blockNumber) =>
    Effect.gen(function* () {
      const hca = yield* validateHcaAddress(parameters.hca);

      const owner = yield* hcaRpc(() =>
        config.publicClient.readContract({
          address: profile.contracts.standaloneFactory,
          abi: standaloneHcaFactoryV2DeploymentAbi,
          functionName: "authorizedOwnerOf",
          args: [hca],
          blockNumber,
        }),
      );

      return owner === zeroAddress ? null : owner;
    }),
  ),
);

export const getHcaImplementationApproval = defineReadAction<
  BlockParameters & { readonly implementation: Address },
  boolean,
  HcaErrorResult
>((config, parameters) =>
  withHcaSnapshot(config, parameters, (profile, blockNumber) =>
    Effect.gen(function* () {
      const implementation = yield* validateHcaAddress(parameters.implementation);

      return yield* hcaRpc(() =>
        config.publicClient.readContract({
          address: profile.contracts.standaloneFactory,
          abi: standaloneHcaFactoryV2DeploymentAbi,
          functionName: "approvedImplementations",
          args: [implementation],
          blockNumber,
        }),
      );
    }),
  ),
);

export const verifyHca = defineReadAction<VerifyHcaParameters, VerifiedHcaAccount, HcaErrorResult>(
  (config, parameters) =>
    withHcaSnapshot(config, parameters, (profile, blockNumber) =>
      Effect.gen(function* () {
        const state = yield* getHca.effect(config, { hca: parameters.hca, blockNumber });

        if (state.status === "undeployed")
          return yield* new HcaError({
            code: "ACCOUNT_UNDEPLOYED",
            message: "The HCA is not deployed",
          });

        const initialImplementation = yield* validateHcaAddress(
          parameters.initialImplementation ?? profile.contracts.standaloneImplementation,
        );

        const salt = yield* validateHcaSalt(parameters.salt ?? profile.generation.canonicalSalt);

        if (parameters.expectedOwner !== undefined) {
          const owner = yield* validateHcaAddress(parameters.expectedOwner);

          if (!isAddressEqual(state.owner, owner))
            return yield* new HcaError({
              code: "OWNER_MISMATCH",
              message: "The HCA belongs to a different owner",
            });
        }

        if (
          !isAddressEqual(initialImplementation, profile.contracts.standaloneImplementation) ||
          !isAddressEqual(state.implementation, profile.contracts.standaloneImplementation) ||
          state.accountId !== profile.generation.accountId
        ) {
          return yield* new HcaError({
            code: "ACCOUNT_MISMATCH",
            message: "The account implementation is outside the supported HCA generation",
          });
        }

        const wiring = yield* verifyHcaDeployment(config.publicClient, profile, blockNumber);

        const predicted = deriveHcaAddress(
          state.owner,
          initialImplementation,
          salt,
          profile.contracts.standaloneFactory,
          profile.deployment.contracts.verifiableFactory,
          wiring.proxyLogic,
        );

        const certified = yield* getAuthorizedHcaOwner.effect(config, {
          hca: state.address,
          blockNumber,
        });

        const implementation = yield* hcaRpc(() =>
          config.publicClient.readContract({
            address: profile.deployment.contracts.verifiableFactory,
            abi: verifiableFactoryV2VerifyContractAbi,
            functionName: "verifyContract",
            args: [state.address],
            blockNumber,
          }),
        );

        if (
          !isAddressEqual(predicted, state.address) ||
          !certified ||
          !isAddressEqual(certified, state.owner) ||
          !isAddressEqual(implementation, state.implementation)
        ) {
          return yield* new HcaError({
            code: "ACCOUNT_MISMATCH",
            message:
              "HCA derivation, proxy implementation or factory owner certification does not match",
          });
        }

        return Object.freeze({
          kind: "ens-hca" as const,
          address: state.address,
          owner: state.owner,
          chainId: config.chainId,
          profileId: profile.generation.id,
          initialImplementation,
          currentImplementation: state.implementation,
          salt,
          sessionNonce: state.sessionNonce,
          verifiedAtBlock: blockNumber,
        });
      }),
    ),
);

export interface HcaCapabilities {
  readonly account: VerifiedHcaAccount;
  readonly ownerExecution: true;
  readonly sessionExecution: false;
  readonly moduleInstallation: false;
  readonly delegatecall: false;
  readonly reasons: readonly string[];
}

export const getHcaCapabilities = defineReadAction<
  VerifyHcaParameters,
  HcaCapabilities,
  HcaErrorResult
>((config, parameters) =>
  verifyHca.effect(config, parameters).pipe(
    Effect.map((account) => ({
      account,
      ownerExecution: true,
      sessionExecution: false,
      moduleInstallation: false,
      delegatecall: false,
      reasons: [
        "Session preparation is not implemented in P1; provider compatibility requires separate verification",
      ],
    })),
  ),
);
