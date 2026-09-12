import { rhinestone, type RhinestoneFundingRoute } from "@ensforge/hca/rhinestone";
import { createPublicClient, createWalletClient, http, type Chain } from "viem";
import { baseSepolia, sepolia } from "viem/chains";

import { owner, profile } from "./client";
import { sessionSigner } from "./rhinestone";

const rpcUrl = process.env.ENSFORGE_BASE_SEPOLIA_RPC_URL;
const apiKey = process.env.RHINESTONE_API_KEY;
if (!rpcUrl || !apiKey) throw new Error("Set ENSFORGE_BASE_SEPOLIA_RPC_URL and RHINESTONE_API_KEY");

const sourceChain: Chain = baseSepolia;

export const sourceClient = createPublicClient({ chain: sourceChain, transport: http(rpcUrl) });
export const sourceWallet = createWalletClient({
  account: owner,
  chain: sourceChain,
  transport: http(rpcUrl),
});

// The manifest is application configuration verified independently of provider quotes.
export const createFundingAdapter = (route: RhinestoneFundingRoute) =>
  rhinestone({
    profile,
    chain: sepolia,
    owner,
    sessionSigner,
    sdk: { apiKey },
    crossChain: {
      routes: [route],
      sourceClients: { [baseSepolia.id]: sourceClient },
    },
  });
