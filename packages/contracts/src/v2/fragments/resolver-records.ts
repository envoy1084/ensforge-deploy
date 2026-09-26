export const permissionedResolverV2SetTextAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "name",
        type: "bytes",
      },
      {
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        internalType: "string",
        name: "value",
        type: "string",
      },
    ],
    name: "setText",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2SetAddressAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "name",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "coinType",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "addressBytes",
        type: "bytes",
      },
    ],
    name: "setAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2SetABIAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "name",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "contentType",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "setABI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2SetContenthashAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "name",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "hash",
        type: "bytes",
      },
    ],
    name: "setContenthash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2SetDataAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "name",
        type: "bytes",
      },
      {
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        internalType: "bytes",
        name: "value",
        type: "bytes",
      },
    ],
    name: "setData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2SetInterfaceAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "name",
        type: "bytes",
      },
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
      {
        internalType: "address",
        name: "implementer",
        type: "address",
      },
    ],
    name: "setInterface",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2SetNameAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "name",
        type: "bytes",
      },
      {
        internalType: "string",
        name: "primaryName",
        type: "string",
      },
    ],
    name: "setName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2LinkToNodeAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "sourceName",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "targetNode",
        type: "bytes32",
      },
    ],
    name: "linkToNode",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2LinkToRecordAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "sourceName",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "recordId",
        type: "uint256",
      },
    ],
    name: "linkToRecord",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2GrantSetterRolesAbi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "setter",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantSetterRoles",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2RevokeRolesAbi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "resource",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "roleBitmap",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRoles",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2GrantRootRolesAbi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roleBitmap",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRootRoles",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const permissionedResolverV2GetRecordIdAbi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "node",
        type: "bytes32",
      },
    ],
    name: "getRecordId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
