/* oxlint-disable no-console -- Runnable guides report submissions and results. */
import "./deploy";
import { hca, salt } from "./account";
import { sdk } from "./client";
import { execution } from "./pimlico";

const name = "your-name.eth";
await sdk.permissions.setRecordPermissions({
  name,
  account: hca,
  records: [
    { type: "text", key: "description" },
    { type: "text", key: "url" },
  ],
  approved: true,
  mode: "sequential",
  atomicity: "none",
  allowScopeWidening: false,
});

const description = "Building with ENS";
const url = "https://example.com";
const submission = await sdk.hca.executeHcaCalls({
  hca,
  salt,
  execution,
  authorization: { kind: "owner" },
  calls: [
    sdk.records.setText.call({ name, key: "description", value: description }),
    sdk.records.setText.call({ name, key: "url", value: url }),
  ],
});
console.log({ submission });

const outcome = await sdk.hca.waitForHcaExecution({ submission, execution });
if (outcome.status !== "succeeded") throw new Error(`HCA execution is ${outcome.status}`);

const value = await sdk.records.getText({ name, key: "description" });
if (value.value !== description) throw new Error("Description did not match");
const savedUrl = await sdk.records.getText({ name, key: "url" });
if (savedUrl.value !== url) throw new Error("URL did not match");
console.log("Profile updated");
