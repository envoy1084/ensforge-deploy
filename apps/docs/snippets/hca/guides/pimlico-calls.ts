import { hca, salt } from "./account";
import { sdk } from "./client";
import { execution } from "./pimlico";

const submission = await sdk.hca.executeHcaCalls({
  hca,
  salt,
  authorization: { kind: "owner" },
  execution,
  calls: [
    sdk.records.setText.call({
      name: "your-name.eth",
      key: "description",
      value: "Updated with Pimlico",
    }),
  ],
});

export const outcome = await sdk.hca.waitForHcaExecution({ submission, execution });
