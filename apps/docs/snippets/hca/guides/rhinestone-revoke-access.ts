/* oxlint-disable no-console -- Runnable guide reports revocation confirmation. */

import { hca } from "./account";
import { publicClient, sdk } from "./client";

const previousNonce = await sdk.hca.getHcaSessionNonce({ hca });
const revocation = await sdk.hca.revokeHcaSessions({ hca });
const receipt = await publicClient.waitForTransactionReceipt({ hash: revocation.hash });
if (receipt.status !== "success") throw new Error("Session revocation reverted");

const currentNonce = await sdk.hca.getHcaSessionNonce({ hca });
if (currentNonce === null || previousNonce === null || currentNonce <= previousNonce)
  throw new Error("Session nonce did not advance");
console.log("All previously signed HCA sessions revoked");
