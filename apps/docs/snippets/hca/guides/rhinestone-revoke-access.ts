/* oxlint-disable no-console -- Runnable guide reports revocation confirmation. */
import { isHex } from "viem";

import { hca } from "./account";
import { publicClient, sdk } from "./client";

const permissionId = process.env.ENSFORGE_HCA_PERMISSION_ID;
if (!permissionId || !isHex(permissionId) || permissionId.length !== 66)
  throw new Error("Set ENSFORGE_HCA_PERMISSION_ID to the session permission ID");

const revocation = await sdk.hca.revokeHcaSessions({ hca });
const receipt = await publicClient.waitForTransactionReceipt({ hash: revocation.hash });
if (receipt.status !== "success") throw new Error("Session revocation reverted");

const enabled = await sdk.hca.isHcaSessionEnabled({ hca, permissionId });
if (enabled) throw new Error("The session is still enabled");

console.log("All HCA sessions revoked; the old permission is disabled");
