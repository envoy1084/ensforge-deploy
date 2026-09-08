import { Ensforge } from "@ensforge/sdk";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

export const sdk = new Ensforge({
  network: "sepolia",
  publicClient: createPublicClient({ chain: sepolia, transport: http() }),
});
