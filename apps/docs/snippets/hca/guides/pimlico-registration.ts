import { hca, salt } from "./account";
import { sdk } from "./client";
import { execution } from "./pimlico";
import { registration } from "./registration";

const operation = await sdk.hca.startHcaRegistration({
  ...registration,
  hca,
  salt,
  authorization: { kind: "owner" },
  execution,
});

// Keep this ID and reconcile submitted work before advancing the next step.
export const progress = await sdk.hca.getHcaRegistration({ id: operation.id, execution });
