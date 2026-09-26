/* oxlint-disable no-console -- Runnable guides report submissions and results. */
import "./deploy";
import { hca, salt } from "./account";
import { advanceRegistration } from "./advance-registration";
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
const authorization = await execution.extensions.sessions.enable(sdk.config, session);

try {
  const operation = await advanceRegistration(sdk, {
    ...registration,
    hca,
    salt,
    execution,
    authorization: {
      kind: "session",
      session: authorization,
    },
    signerReference: "registration-session",
  });
  console.log({ id: operation.id, progress: operation.progress });
  if (operation.progress.status === "registered") console.log("Name registered");
} finally {
  database.close();
}
