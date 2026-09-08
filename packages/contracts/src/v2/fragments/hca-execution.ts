import type { Abi } from "viem";

const hcaExecutionErrors = [
  {
    inputs: [],
    name: "CallerNotOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "ExecutionFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "InnerCallFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "UnauthorizedCallContext",
    type: "error",
  },
] as const satisfies Abi;

export const standaloneHcaV2ExecuteByOwnerAbi = [
  ...hcaExecutionErrors,
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "callData",
            type: "bytes",
          },
        ],
        internalType: "struct Execution[]",
        name: "executions",
        type: "tuple[]",
      },
    ],
    name: "executeByOwner",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const satisfies Abi;

export const standaloneHcaV2RevokeSessionsAbi = [
  ...hcaExecutionErrors,
  {
    inputs: [],
    name: "revokeSessions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const satisfies Abi;
