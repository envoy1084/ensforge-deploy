import type { Abi } from "viem";

/** Exact deployment fragments from the pinned Sepolia artifact snapshot. */
export const standaloneHcaFactoryV2DeploymentAbi = [
  {
    inputs: [],
    name: "HCAImplementationCannotBeZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "hcaImplementation",
        type: "address",
      },
    ],
    name: "HCAImplementationNotApproved",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "hca",
        type: "address",
      },
    ],
    name: "HCAOwnerUnavailable",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
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
        name: "expectedImplementation",
        type: "address",
      },
      {
        internalType: "address",
        name: "actualImplementation",
        type: "address",
      },
    ],
    name: "UnexpectedHCAImplementation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "expectedOwner",
        type: "address",
      },
      {
        internalType: "address",
        name: "actualOwner",
        type: "address",
      },
    ],
    name: "UnexpectedHCAOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "VerifiableFactoryCannotBeZero",
    type: "error",
  },
  {
    inputs: [],
    name: "VERIFIABLE_FACTORY",
    outputs: [
      {
        internalType: "contract IVerifiableFactory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "approvedImplementations",
    outputs: [
      {
        internalType: "bool",
        name: "approved",
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
        name: "hca",
        type: "address",
      },
    ],
    name: "authorizedOwnerOf",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "hcaImplementation",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "userSalt",
        type: "uint256",
      },
    ],
    name: "deploy",
    outputs: [
      {
        internalType: "address",
        name: "hca",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "hcaImplementation",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "userSalt",
        type: "uint256",
      },
    ],
    name: "deploymentSalt",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const satisfies Abi;
