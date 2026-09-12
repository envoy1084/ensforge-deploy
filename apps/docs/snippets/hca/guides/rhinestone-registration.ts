import type { HcaAuthorization } from "@ensforge/sdk/hca";

import { hca, salt } from "./account";
import { publicClient, sdk } from "./client";
import { registration } from "./registration";
import { execution } from "./rhinestone";

const session = await execution.extensions.sessions.prepare(sdk.config, {
  hca,
  salt,
  resolver: registration.resolver,
  validUntil: Math.floor(Date.now() / 1000) + 3600,
});
const enabled = await execution.extensions.sessions.enable(sdk.config, session);
const receipt = await publicClient.waitForTransactionReceipt({ hash: enabled.hash });
if (receipt.status !== "success") throw new Error("Session enablement reverted");

const authorization: HcaAuthorization = {
  kind: "session",
  permissionId: session.parameters.permissionId,
  enableTransactionHash: enabled.hash,
};
export const operation = await sdk.hca.startHcaRegistration({
  ...registration,
  hca,
  salt,
  authorization,
  execution,
  signerReference: "registration-session",
});
