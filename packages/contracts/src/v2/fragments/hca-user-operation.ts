import type { Abi } from "viem";

/** EntryPoint execution ABI from the recorded Sepolia deployment artifact. */
export const standaloneHcaV2UserOperationAbi = [
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
    inputs: [
      {
        internalType: "ExecutionMode",
        name: "mode",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "executionCalldata",
        type: "bytes",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const satisfies Abi;
