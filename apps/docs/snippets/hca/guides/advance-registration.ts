// Polling and progression must run sequentially against the saved operation.
/* oxlint-disable no-await-in-loop */
import { setTimeout } from "node:timers/promises";

import type { StartHcaRegistrationParameters } from "@ensforge/core/hca";
import type { Ensforge } from "@ensforge/sdk";

export const advanceRegistration = async (sdk: Ensforge, input: StartHcaRegistrationParameters) => {
  let operation = await sdk.hca.startHcaRegistration(input);
  const deadline = Date.now() + 15 * 60_000;

  while (Date.now() < deadline) {
    process.stdout.write(
      `${JSON.stringify({ id: operation.id, status: operation.progress.status })}\n`,
    );
    if (operation.progress.status === "submitted" || operation.progress.status === "submitting") {
      await setTimeout(2000);
      operation = await sdk.hca.getHcaRegistration({
        id: operation.id,
        ...(input.execution ? { execution: input.execution } : {}),
      });
      continue;
    }
    if (operation.progress.status !== "waiting") return operation;

    const delay = Math.max(1000, Number(operation.progress.readyAt) * 1000 - Date.now());
    if (Date.now() + delay > deadline) return operation;
    await setTimeout(delay);
    operation = await sdk.hca.resumeHcaRegistration({
      id: operation.id,
      ...(input.execution ? { execution: input.execution } : {}),
    });
  }
  return operation;
};
