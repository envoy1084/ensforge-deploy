import { hca, salt } from "./account";
import { sdk } from "./client";

const submission = await sdk.hca.executeHcaCalls({
  hca,
  salt,
  authorization: { kind: "owner" },
  calls: [
    sdk.records.setText.call({
      name: "your-name.eth",
      key: "description",
      value: "Built with ENSforge",
    }),
  ],
});

export const outcome = await sdk.hca.waitForHcaExecution({ submission });
