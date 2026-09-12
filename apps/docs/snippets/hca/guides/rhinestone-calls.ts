import { hca, salt } from "./account";
import { sdk } from "./client";
import { execution } from "./rhinestone";
import { authorization } from "./session";

const submission = await sdk.hca.executeHcaCalls({
  hca,
  salt,
  authorization,
  execution,
  calls: [
    sdk.records.setText.call({
      name: "your-name.eth",
      key: "description",
      value: "Updated with a session",
    }),
  ],
});

export const outcome = await sdk.hca.waitForHcaExecution({ submission, execution });
