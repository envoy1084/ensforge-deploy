/* oxlint-disable no-console -- Runnable guides report submissions and results. */
import "./deploy";
import { isHex } from "viem";

import { hca, salt } from "./account";
import { advanceRegistration } from "./advance-registration";
import { publicClient } from "./client";
import { registration } from "./registration";
import { execution } from "./rhinestone";
import { database, sdk } from "./workflow-client";

const validUntil = Number(process.env.ENSFORGE_HCA_SESSION_VALID_UNTIL);
if (!Number.isSafeInteger(validUntil) || validUntil <= Math.floor(Date.now() / 1000))
  throw new Error("Set ENSFORGE_HCA_SESSION_VALID_UNTIL to a future Unix timestamp in seconds");

const session = await execution.extensions.sessions.prepare(sdk.config, {
  hca,
  salt,
  resolver: registration.resolver,
  validUntil,
});
let enableTransactionHash = process.env.ENSFORGE_HCA_SESSION_ENABLE_HASH;
if (!enableTransactionHash) {
  const enabled = await execution.extensions.sessions.enable(sdk.config, session);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: enabled.hash });
  if (receipt.status !== "success") throw new Error("Session enablement reverted");
  console.log({ ENSFORGE_HCA_SESSION_ENABLE_HASH: enabled.hash });
  enableTransactionHash = enabled.hash;
}
if (!isHex(enableTransactionHash) || enableTransactionHash.length !== 66)
  throw new Error("Invalid session enable transaction hash");

try {
  const operation = await advanceRegistration(sdk, {
    ...registration,
    hca,
    salt,
    execution,
    authorization: {
      kind: "session",
      permissionId: session.parameters.permissionId,
      enableTransactionHash,
    },
    signerReference: "registration-session",
  });
  console.log({ id: operation.id, progress: operation.progress });
  if (operation.progress.status === "registered") console.log("Name registered");
} finally {
  database.close();
}
