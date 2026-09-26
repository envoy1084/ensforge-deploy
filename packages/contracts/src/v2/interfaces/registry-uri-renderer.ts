/** IRegistryURIRenderer ABI from the pinned ENSv2 deployment source. */
export const registryUriRendererV2InterfaceAbi = [
  {
    inputs: [
      {
        internalType: "contract IRegistry",
        name: "registry",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "renderURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
