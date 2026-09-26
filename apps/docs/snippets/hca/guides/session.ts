import type { HcaAuthorization } from "@ensforge/sdk/hca";

import { hca, salt } from "./account";
import { sdk } from "./client";
import { resolver } from "./permissions";
import { execution } from "./rhinestone";

const prepared = await execution.extensions.sessions.prepare(sdk.config, {
  hca,
  salt,
  resolver,
  validUntil: Math.floor(Date.now() / 1000) + 3600,
});

const enabled = await execution.extensions.sessions.enable(sdk.config, prepared);

export const authorization: HcaAuthorization = {
  kind: "session",
  session: enabled,
};
