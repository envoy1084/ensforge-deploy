import { sepoliaHcaDeployment } from "@ensforge/contracts/deployments";
import { Ensforge } from "@ensforge/sdk";
import { createPublicClient, createWalletClient, http, isAddress, isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { createSqliteStorage } from "./sqlite-storage.js";

export const database = createSqliteStorage(".ensforge/hca-example");

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const privateKey = process.env.HCA_OWNER_PRIVATE_KEY;
const resolver = process.env.HCA_RESOLVER;
const paymentToken = process.env.HCA_PAYMENT_TOKEN;
const name = process.env.HCA_REGISTRATION_NAME;
const maximumPrice = process.env.HCA_MAX_REGISTRATION_PRICE;
if (!rpcUrl || !privateKey || !isHex(privateKey) || privateKey.length !== 66)
  throw new Error("Set SEPOLIA_RPC_URL and HCA_OWNER_PRIVATE_KEY in .env.hca");
if (
  !resolver ||
  !isAddress(resolver) ||
  !paymentToken ||
  !isAddress(paymentToken) ||
  !name ||
  !maximumPrice
)
  throw new Error(
    "Set HCA_RESOLVER, HCA_PAYMENT_TOKEN, HCA_REGISTRATION_NAME and HCA_MAX_REGISTRATION_PRICE",
  );

export const owner = privateKeyToAccount(privateKey);
export const profile = sepoliaHcaDeployment;
export const sdk = new Ensforge({
  network: "sepolia",
  hca: profile,
  storage: database.storage,
  publicClient: createPublicClient({ chain: sepolia, transport: http(rpcUrl) }),
  walletClient: createWalletClient({ chain: sepolia, account: owner, transport: http(rpcUrl) }),
});
export const registration = {
  name,
  resolver,
  paymentToken,
  duration: 31_536_000n,
  limits: {
    registrationPrice: BigInt(maximumPrice),
    fees: process.env.HCA_MAX_EXECUTION_FEE
      ? [
          {
            kind: "execution" as const,
            chainId: sepolia.id,
            token: "native" as const,
            maximum: BigInt(process.env.HCA_MAX_EXECUTION_FEE),
          },
        ]
      : [],
  },
};
