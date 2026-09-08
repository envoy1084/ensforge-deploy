import type { Abi } from "viem";

/** Exact deployment fragments from the pinned Sepolia artifact snapshot. */
export const standaloneHcaV2InspectionAbi = [
  {
    inputs: [],
    name: "AccountAccessUnauthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "AccountAlreadyInitialized",
    type: "error",
  },
  {
    inputs: [],
    name: "AccountNotInitialized",
    type: "error",
  },
  {
    inputs: [],
    name: "CallerNotOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "CanNotRemoveLastValidator",
    type: "error",
  },
  {
    inputs: [],
    name: "ComposableExecutionFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "enum ConstraintType",
        name: "constraintType",
        type: "uint8",
      },
    ],
    name: "ConstraintNotMet",
    type: "error",
  },
  {
    inputs: [],
    name: "DefaultValidatorAlreadyInstalled",
    type: "error",
  },
  {
    inputs: [],
    name: "DelegateCallNotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "ERC7702AccountCannotBeUpgradedThisWay",
    type: "error",
  },
  {
    inputs: [],
    name: "EmergencyTimeLockNotExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "EmergencyUninstallSigError",
    type: "error",
  },
  {
    inputs: [],
    name: "EnableModeSigError",
    type: "error",
  },
  {
    inputs: [],
    name: "EntryPointCanNotBeZero",
    type: "error",
  },
  {
    inputs: [],
    name: "ExecutionFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4",
      },
    ],
    name: "FallbackAlreadyInstalledForSelector",
    type: "error",
  },
  {
    inputs: [],
    name: "FallbackCallTypeInvalid",
    type: "error",
  },
  {
    inputs: [],
    name: "FallbackHandlerUninstallFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4",
      },
    ],
    name: "FallbackNotInstalledForSelector",
    type: "error",
  },
  {
    inputs: [],
    name: "FallbackSelectorForbidden",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "currentHook",
        type: "address",
      },
    ],
    name: "HookAlreadyInstalled",
    type: "error",
  },
  {
    inputs: [],
    name: "HookPostCheckFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "ImplementationIsNotAContract",
    type: "error",
  },
  {
    inputs: [],
    name: "InnerCallFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidConstraintType",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidImplementationAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInitData",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInput",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "module",
        type: "address",
      },
    ],
    name: "InvalidModule",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256",
      },
    ],
    name: "InvalidModuleTypeId",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidNonce",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOutputParamFetcherType",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPREP",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidParameterEncoding",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "entry",
        type: "address",
      },
    ],
    name: "LinkedList_InvalidEntry",
    type: "error",
  },
  {
    inputs: [],
    name: "LinkedList_InvalidPage",
    type: "error",
  },
  {
    inputs: [],
    name: "MismatchModuleTypeId",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4",
      },
    ],
    name: "MissingFallbackHandler",
    type: "error",
  },
  {
    inputs: [],
    name: "ModuleAddressCanNotBeZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "module",
        type: "address",
      },
    ],
    name: "ModuleAlreadyInstalled",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "module",
        type: "address",
      },
    ],
    name: "ModuleNotInstalled",
    type: "error",
  },
  {
    inputs: [],
    name: "NexusInitializationFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "NoModuleChangeAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "NoNFTAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "NoValidatorInstalled",
    type: "error",
  },
  {
    inputs: [],
    name: "Output_StaticCallFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "OwnerCannotBeZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "currentPreValidationHook",
        type: "address",
      },
    ],
    name: "PrevalidationHookAlreadyInstalled",
    type: "error",
  },
  {
    inputs: [],
    name: "StandaloneHCAAlreadyInitialized",
    type: "error",
  },
  {
    inputs: [],
    name: "UnauthorizedCallContext",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "UnauthorizedOperation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "CallType",
        name: "callType",
        type: "bytes1",
      },
    ],
    name: "UnsupportedCallType",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "ExecType",
        name: "execType",
        type: "bytes1",
      },
    ],
    name: "UnsupportedExecType",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256",
      },
    ],
    name: "UnsupportedModuleType",
    type: "error",
  },
  {
    inputs: [],
    name: "UpgradeFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "UpgradeTargetNotApproved",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "module",
        type: "address",
      },
    ],
    name: "ValidatorNotInstalled",
    type: "error",
  },
  {
    inputs: [],
    name: "PREDECESSOR_UPGRADE_GATE",
    outputs: [
      {
        internalType: "contract ApprovedUpgradeGate",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "UPGRADE_GATE",
    outputs: [
      {
        internalType: "contract ApprovedUpgradeGate",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "accountId",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "entryPoint",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getImplementation",
    outputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "moduleTypeId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "module",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "additionalContext",
        type: "bytes",
      },
    ],
    name: "isModuleInstalled",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ownerAndSessionNonce",
    outputs: [
      {
        internalType: "address",
        name: "owner_",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "sessionNonce_",
        type: "uint96",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const satisfies Abi;
