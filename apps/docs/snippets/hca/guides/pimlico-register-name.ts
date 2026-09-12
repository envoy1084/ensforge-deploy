/* oxlint-disable no-console -- Runnable guides report submissions and results. */
import "./deploy";
import { hca, salt } from "./account";
import { advanceRegistration } from "./advance-registration";
import { execution } from "./pimlico";
import { registration } from "./registration";
import { database, sdk } from "./workflow-client";

try {
  const operation = await advanceRegistration(sdk, {
    ...registration,
    hca,
    salt,
    execution,
    authorization: { kind: "owner" },
  });
  console.log({ id: operation.id, progress: operation.progress });
  if (operation.progress.status === "registered") console.log("Name registered");
} finally {
  database.close();
}
