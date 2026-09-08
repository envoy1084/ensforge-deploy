import { createConfig } from "@ensforge/core";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

export const config = createConfig({
  network: "sepolia",
  publicClient: createPublicClient({ chain: sepolia, transport: http() }),
});
