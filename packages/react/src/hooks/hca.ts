"use client";

import {
  getHcaAtom,
  getHcaOwnerAtom,
  getHcaImplementationAtom,
  getHcaAccountIdAtom,
  getHcaSessionNonceAtom,
  getAuthorizedHcaOwnerAtom,
  getHcaImplementationApprovalAtom,
  verifyHcaAtom,
  getHcaCapabilitiesAtom,
  predictHcaAddressAtom,
  getHcaEntryPointAtom,
  getHcaDepositAtom,
  getHcaNonceAtom,
  getHcaSigningDomainAtom,
  verifyHcaSignatureAtom,
  getHcaValidatorsAtom,
  getHcaExecutorsAtom,
  getHcaHookAtom,
  getHcaFallbackHandlerAtom,
  getHcaRegistryAtom,
  isHcaModuleInstalledAtom,
  supportsHcaExecutionModeAtom,
  getHcaUpgradeEligibilityAtom,
  isHcaImplementationTrustedAtom,
  getHcaUpgradeImplementationApprovalAtom,
  getHcaRegistrationAtom,
  getHcaExecutionStatusAtom,
  isHcaSessionEnabledAtom,
  createDeployHcaMutationAtom,
  createPrepareHcaCallsMutationAtom,
  createExecuteHcaCallsMutationAtom,
  createWaitForHcaExecutionMutationAtom,
  createEnableHcaSessionMutationAtom,
  createEnableHcaSessionWithRefundMutationAtom,
  createRevokeHcaSessionsMutationAtom,
  createStartHcaRegistrationMutationAtom,
  createResumeHcaRegistrationMutationAtom,
  createCancelHcaRegistrationMutationAtom,
  createAddHcaDepositMutationAtom,
  createWithdrawHcaDepositMutationAtom,
  createUpgradeHcaMutationAtom,
} from "../atoms/hca.js";
import { makeMutationHook } from "./use-mutation.js";
import { makeQueryHook } from "./use-query.js";
import { makeSuspenseQueryHook } from "./use-suspense-query.js";

export const useHca = makeQueryHook(getHcaAtom);
export const useHcaSuspense = makeSuspenseQueryHook(getHcaAtom);

export const useHcaOwner = makeQueryHook(getHcaOwnerAtom);
export const useHcaOwnerSuspense = makeSuspenseQueryHook(getHcaOwnerAtom);

export const useHcaImplementation = makeQueryHook(getHcaImplementationAtom);
export const useHcaImplementationSuspense = makeSuspenseQueryHook(getHcaImplementationAtom);

export const useHcaAccountId = makeQueryHook(getHcaAccountIdAtom);
export const useHcaAccountIdSuspense = makeSuspenseQueryHook(getHcaAccountIdAtom);

export const useHcaSessionNonce = makeQueryHook(getHcaSessionNonceAtom);
export const useHcaSessionNonceSuspense = makeSuspenseQueryHook(getHcaSessionNonceAtom);

export const useAuthorizedHcaOwner = makeQueryHook(getAuthorizedHcaOwnerAtom);
export const useAuthorizedHcaOwnerSuspense = makeSuspenseQueryHook(getAuthorizedHcaOwnerAtom);

export const useHcaImplementationApproval = makeQueryHook(getHcaImplementationApprovalAtom);
export const useHcaImplementationApprovalSuspense = makeSuspenseQueryHook(
  getHcaImplementationApprovalAtom,
);

export const useVerifyHca = makeQueryHook(verifyHcaAtom);
export const useVerifyHcaSuspense = makeSuspenseQueryHook(verifyHcaAtom);

export const useHcaCapabilities = makeQueryHook(getHcaCapabilitiesAtom);
export const useHcaCapabilitiesSuspense = makeSuspenseQueryHook(getHcaCapabilitiesAtom);

export const usePredictHcaAddress = makeQueryHook(predictHcaAddressAtom);
export const usePredictHcaAddressSuspense = makeSuspenseQueryHook(predictHcaAddressAtom);

export const useHcaEntryPoint = makeQueryHook(getHcaEntryPointAtom);
export const useHcaEntryPointSuspense = makeSuspenseQueryHook(getHcaEntryPointAtom);

export const useHcaDeposit = makeQueryHook(getHcaDepositAtom);
export const useHcaDepositSuspense = makeSuspenseQueryHook(getHcaDepositAtom);

export const useHcaNonce = makeQueryHook(getHcaNonceAtom);
export const useHcaNonceSuspense = makeSuspenseQueryHook(getHcaNonceAtom);

export const useHcaSigningDomain = makeQueryHook(getHcaSigningDomainAtom);
export const useHcaSigningDomainSuspense = makeSuspenseQueryHook(getHcaSigningDomainAtom);

export const useVerifyHcaSignature = makeQueryHook(verifyHcaSignatureAtom);
export const useVerifyHcaSignatureSuspense = makeSuspenseQueryHook(verifyHcaSignatureAtom);

export const useHcaValidators = makeQueryHook(getHcaValidatorsAtom);
export const useHcaValidatorsSuspense = makeSuspenseQueryHook(getHcaValidatorsAtom);

export const useHcaExecutors = makeQueryHook(getHcaExecutorsAtom);
export const useHcaExecutorsSuspense = makeSuspenseQueryHook(getHcaExecutorsAtom);

export const useHcaHook = makeQueryHook(getHcaHookAtom);
export const useHcaHookSuspense = makeSuspenseQueryHook(getHcaHookAtom);

export const useHcaFallbackHandler = makeQueryHook(getHcaFallbackHandlerAtom);
export const useHcaFallbackHandlerSuspense = makeSuspenseQueryHook(getHcaFallbackHandlerAtom);

export const useHcaRegistry = makeQueryHook(getHcaRegistryAtom);
export const useHcaRegistrySuspense = makeSuspenseQueryHook(getHcaRegistryAtom);

export const useIsHcaModuleInstalled = makeQueryHook(isHcaModuleInstalledAtom);
export const useIsHcaModuleInstalledSuspense = makeSuspenseQueryHook(isHcaModuleInstalledAtom);

export const useSupportsHcaExecutionMode = makeQueryHook(supportsHcaExecutionModeAtom);
export const useSupportsHcaExecutionModeSuspense = makeSuspenseQueryHook(
  supportsHcaExecutionModeAtom,
);

export const useHcaUpgradeEligibility = makeQueryHook(getHcaUpgradeEligibilityAtom);
export const useHcaUpgradeEligibilitySuspense = makeSuspenseQueryHook(getHcaUpgradeEligibilityAtom);

export const useIsHcaImplementationTrusted = makeQueryHook(isHcaImplementationTrustedAtom);
export const useIsHcaImplementationTrustedSuspense = makeSuspenseQueryHook(
  isHcaImplementationTrustedAtom,
);

export const useHcaUpgradeImplementationApproval = makeQueryHook(
  getHcaUpgradeImplementationApprovalAtom,
);
export const useHcaUpgradeImplementationApprovalSuspense = makeSuspenseQueryHook(
  getHcaUpgradeImplementationApprovalAtom,
);

export const useHcaRegistration = makeQueryHook(getHcaRegistrationAtom);
export const useHcaRegistrationSuspense = makeSuspenseQueryHook(getHcaRegistrationAtom);

export const useHcaExecutionStatus = makeQueryHook(getHcaExecutionStatusAtom);
export const useHcaExecutionStatusSuspense = makeSuspenseQueryHook(getHcaExecutionStatusAtom);

export const useIsHcaSessionEnabled = makeQueryHook(isHcaSessionEnabledAtom);
export const useIsHcaSessionEnabledSuspense = makeSuspenseQueryHook(isHcaSessionEnabledAtom);

export const useDeployHca = makeMutationHook(createDeployHcaMutationAtom);

export const usePrepareHcaCalls = makeMutationHook(createPrepareHcaCallsMutationAtom);

export const useExecuteHcaCalls = makeMutationHook(createExecuteHcaCallsMutationAtom);

export const useWaitForHcaExecution = makeMutationHook(createWaitForHcaExecutionMutationAtom);

export const useEnableHcaSession = makeMutationHook(createEnableHcaSessionMutationAtom);

export const useEnableHcaSessionWithRefund = makeMutationHook(
  createEnableHcaSessionWithRefundMutationAtom,
);

export const useRevokeHcaSessions = makeMutationHook(createRevokeHcaSessionsMutationAtom);

export const useStartHcaRegistration = makeMutationHook(createStartHcaRegistrationMutationAtom);

export const useResumeHcaRegistration = makeMutationHook(createResumeHcaRegistrationMutationAtom);

export const useCancelHcaRegistration = makeMutationHook(createCancelHcaRegistrationMutationAtom);

export const useAddHcaDeposit = makeMutationHook(createAddHcaDepositMutationAtom);

export const useWithdrawHcaDeposit = makeMutationHook(createWithdrawHcaDepositMutationAtom);

export const useUpgradeHca = makeMutationHook(createUpgradeHcaMutationAtom);
