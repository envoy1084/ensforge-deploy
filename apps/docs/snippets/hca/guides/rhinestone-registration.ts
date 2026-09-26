import type { HcaAuthorization } from "@ensforge/sdk/hca";

import { hca, salt } from "./account";
import { sdk } from "./client";
import { registration } from "./registration";
import { execution } from "./rhinestone";

const session = await execution.extensions.sessions.prepare(sdk.config, {
  hca,
  salt,
  resolver: registration.resolver,
  validUntil: Math.floor(Date.now() / 1000) + 3600,
});
const enabled = await execution.extensions.sessions.enable(sdk.config, session);

const authorization: HcaAuthorization = {
  kind: "session",
  session: enabled,
};
export const operation = await sdk.hca.startHcaRegistration({
  ...registration,
  hca,
  salt,
  authorization,
  execution,
  signerReference: "registration-session",
});
