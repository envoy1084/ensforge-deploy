import { rhinestone } from "@ensforge/hca/rhinestone";
import { isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { owner, profile } from "./client";

const apiKey = process.env.RHINESTONE_API_KEY;
const privateKey = process.env.ENSFORGE_HCA_SESSION_PRIVATE_KEY;
if (!apiKey || !privateKey || !isHex(privateKey) || privateKey.length !== 66)
  throw new Error("Set RHINESTONE_API_KEY and ENSFORGE_HCA_SESSION_PRIVATE_KEY");

export const sessionSigner = privateKeyToAccount(privateKey);
export const execution = rhinestone({
  profile,
  chain: sepolia,
  owner,
  sessionSigner,
  sdk: { apiKey },
});
