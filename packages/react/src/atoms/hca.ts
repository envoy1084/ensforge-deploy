import { makeMutationAtom } from "./mutation.js";
import { makeQueryAtom } from "./query.js";

export const getHcaAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHca);

export const getHcaOwnerAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaOwner);

export const getHcaImplementationAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaImplementation);

export const getHcaAccountIdAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaAccountId);

export const getHcaSessionNonceAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaSessionNonce);

export const getAuthorizedHcaOwnerAtom = makeQueryAtom(
  "hca",
  (sdk) => sdk.hca.getAuthorizedHcaOwner,
);

export const getHcaImplementationApprovalAtom = makeQueryAtom(
  "hca",
  (sdk) => sdk.hca.getHcaImplementationApproval,
);

export const verifyHcaAtom = makeQueryAtom("hca", (sdk) => sdk.hca.verifyHca);

export const getHcaCapabilitiesAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaCapabilities);

export const predictHcaAddressAtom = makeQueryAtom("hca", (sdk) => sdk.hca.predictHcaAddress);

export const getHcaEntryPointAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaEntryPoint);

export const getHcaDepositAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaDeposit);

export const getHcaNonceAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaNonce);

export const getHcaSigningDomainAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaSigningDomain);

export const verifyHcaSignatureAtom = makeQueryAtom("hca", (sdk) => sdk.hca.verifyHcaSignature);

export const getHcaValidatorsAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaValidators);

export const getHcaExecutorsAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaExecutors);

export const getHcaHookAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaHook);

export const getHcaFallbackHandlerAtom = makeQueryAtom(
  "hca",
  (sdk) => sdk.hca.getHcaFallbackHandler,
);

export const getHcaRegistryAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaRegistry);

export const isHcaModuleInstalledAtom = makeQueryAtom("hca", (sdk) => sdk.hca.isHcaModuleInstalled);

export const supportsHcaExecutionModeAtom = makeQueryAtom(
  "hca",
  (sdk) => sdk.hca.supportsHcaExecutionMode,
);

export const getHcaUpgradeEligibilityAtom = makeQueryAtom(
  "hca",
  (sdk) => sdk.hca.getHcaUpgradeEligibility,
);

export const isHcaImplementationTrustedAtom = makeQueryAtom(
  "hca",
  (sdk) => sdk.hca.isHcaImplementationTrusted,
);

export const getHcaUpgradeImplementationApprovalAtom = makeQueryAtom(
  "hca",
  (sdk) => sdk.hca.getHcaUpgradeImplementationApproval,
);

export const getHcaRegistrationAtom = makeQueryAtom("hca", (sdk) => sdk.hca.getHcaRegistration);

export const getHcaExecutionStatusAtom = makeQueryAtom(
  "hca",
  (sdk) => sdk.hca.getHcaExecutionStatus,
);

export const isHcaSessionEnabledAtom = makeQueryAtom("hca", (sdk) => sdk.hca.isHcaSessionEnabled);

export const createDeployHcaMutationAtom = makeMutationAtom("hca", (sdk) => sdk.hca.deployHca);

export const createPrepareHcaCallsMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.prepareHcaCalls,
);

export const createExecuteHcaCallsMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.executeHcaCalls,
);

export const createWaitForHcaExecutionMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.waitForHcaExecution,
);

export const createEnableHcaSessionMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.enableHcaSession,
);

export const createEnableHcaSessionWithRefundMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.enableHcaSessionWithRefund,
);

export const createRevokeHcaSessionsMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.revokeHcaSessions,
);

export const createStartHcaRegistrationMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.startHcaRegistration,
);

export const createResumeHcaRegistrationMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.resumeHcaRegistration,
);

export const createCancelHcaRegistrationMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.cancelHcaRegistration,
);

export const createAddHcaDepositMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.addHcaDeposit,
);

export const createWithdrawHcaDepositMutationAtom = makeMutationAtom(
  "hca",
  (sdk) => sdk.hca.withdrawHcaDeposit,
);

export const createUpgradeHcaMutationAtom = makeMutationAtom("hca", (sdk) => sdk.hca.upgradeHca);
