/* oxlint-disable no-console -- Runnable guides report submissions and results. */
import "./deploy";
import { hca, salt } from "./account";
import { sdk } from "./client";
import { name } from "./permissions";
import { execution } from "./rhinestone";
import { authorization } from "./session";

const description = "Building with ENS";
const submission = await sdk.hca.executeHcaCalls({
  hca,
  salt,
  execution,
  authorization,
  calls: [sdk.records.setText.call({ name, key: "description", value: description })],
});
console.log({ submission });

const outcome = await sdk.hca.waitForHcaExecution({ submission, execution });
if (outcome.status !== "succeeded") throw new Error(`HCA execution is ${outcome.status}`);

const value = await sdk.records.getText({ name, key: "description" });
if (value.value !== description) throw new Error("Description did not match");
console.log("Profile updated");
