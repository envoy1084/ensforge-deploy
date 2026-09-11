/** Fixed session ABI from the recorded Sepolia deployment artifact. */
export const hcaValidatorV2SessionsAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes4",
        name: "selector",
        type: "bytes4",
      },
    ],
    name: "ActionNotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "CallerNotIntentExecutor",
    type: "error",
  },
  {
    inputs: [],
    name: "GasRefundNotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOperationEncoding",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSessionData",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSigner",
    type: "error",
  },
  {
    inputs: [],
    name: "OwnerUnavailable",
    type: "error",
  },
  {
    inputs: [],
    name: "PolicyRuleFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "SessionExpired",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "permissionId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sessionKey",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "resolver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint48",
        name: "validUntil",
        type: "uint48",
      },
      {
        indexed: false,
        internalType: "uint96",
        name: "sessionNonce",
        type: "uint96",
      },
    ],
    name: "SessionEnabled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "permissionId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint96",
        name: "maxExchangeRate",
        type: "uint96",
      },
      {
        indexed: false,
        internalType: "uint48",
        name: "maxGasOverhead",
        type: "uint48",
      },
      {
        indexed: false,
        internalType: "uint96",
        name: "maxRefundAmount",
        type: "uint96",
      },
    ],
    name: "SessionRefundConfigured",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "permissionId",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "sessionKey",
        type: "address",
      },
      {
        internalType: "uint48",
        name: "validUntil",
        type: "uint48",
      },
      {
        internalType: "address",
        name: "resolver",
        type: "address",
      },
    ],
    name: "enableSession",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "permissionId",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "sessionKey",
        type: "address",
      },
      {
        internalType: "uint48",
        name: "validUntil",
        type: "uint48",
      },
      {
        internalType: "address",
        name: "resolver",
        type: "address",
      },
      {
        internalType: "address",
        name: "refundToken",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "maxRefundExchangeRate",
        type: "uint96",
      },
      {
        internalType: "uint48",
        name: "maxRefundGasOverhead",
        type: "uint48",
      },
      {
        internalType: "uint96",
        name: "maxRefundAmount",
        type: "uint96",
      },
    ],
    name: "enableSessionWithRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "permissionId",
        type: "bytes32",
      },
    ],
    name: "isPermissionEnabled",
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
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "hash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "isValidSignatureWithSender",
    outputs: [
      {
        internalType: "bytes4",
        name: "magicValue",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        components: [
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct HCAOwnerAndSessionValidator.Operation",
        name: "operation",
        type: "tuple",
      },
    ],
    name: "verifyExecution",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
