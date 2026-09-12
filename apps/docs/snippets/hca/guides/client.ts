import { sepoliaHcaDeployment } from "@ensforge/contracts/deployments";
import { Ensforge } from "@ensforge/sdk";
import { createPublicClient, createWalletClient, http, isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const rpcUrl = process.env.ENSFORGE_SEPOLIA_RPC_URL;
const privateKey = process.env.ENSFORGE_SEPOLIA_PRIVATE_KEY;
if (!rpcUrl || !privateKey || !isHex(privateKey) || privateKey.length !== 66)
  throw new Error("Set ENSFORGE_SEPOLIA_RPC_URL and ENSFORGE_SEPOLIA_PRIVATE_KEY");

export const owner = privateKeyToAccount(privateKey);
export const profile = sepoliaHcaDeployment;
export const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
export const walletClient = createWalletClient({
  account: owner,
  chain: sepolia,
  transport: http(rpcUrl),
});

export const sdk = new Ensforge({
  network: "sepolia",
  hca: profile,
  publicClient,
  walletClient,
});
