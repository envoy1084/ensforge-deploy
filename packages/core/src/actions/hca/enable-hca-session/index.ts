import { defineWriteAction, type EnsWriteAction } from "../../../action/write-intent.js";
import { prepareHcaSession } from "../../../internal/hca/prepare-session.js";
import type { WriteError } from "../../../write/types.js";
import { executeHcaCalls } from "../execute-hca-calls/index.js";
import type { HcaTransactionSubmission } from "../types.js";
import type { EnableHcaSessionParameters } from "./types.js";

export const enableHcaSession: EnsWriteAction<
  EnableHcaSessionParameters,
  HcaTransactionSubmission,
  WriteError
> = defineWriteAction<EnableHcaSessionParameters, HcaTransactionSubmission, WriteError>(
  "enableHcaSession",
  (config, parameters) =>
    executeHcaCalls.effect(config, {
      ...parameters,
      authorization: { kind: "owner" },
      calls: [enableHcaSession.call(parameters)],
    }),
  prepareHcaSession,
);

export type { EnableHcaSessionParameters } from "./types.js";
