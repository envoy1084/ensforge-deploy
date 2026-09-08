import { defineWriteAction, type EnsWriteAction } from "../../../action/write-intent.js";
import { prepareHcaSession } from "../../../internal/hca/prepare-session.js";
import type { WriteError } from "../../../write/types.js";
import { executeHcaCalls } from "../execute-hca-calls/index.js";
import type { HcaTransactionSubmission } from "../types.js";
import type { EnableHcaSessionWithRefundParameters } from "./types.js";

export const enableHcaSessionWithRefund: EnsWriteAction<
  EnableHcaSessionWithRefundParameters,
  HcaTransactionSubmission,
  WriteError
> = defineWriteAction<EnableHcaSessionWithRefundParameters, HcaTransactionSubmission, WriteError>(
  "enableHcaSessionWithRefund",
  (config, parameters) =>
    executeHcaCalls.effect(config, {
      ...parameters,
      authorization: { kind: "owner" },
      calls: [enableHcaSessionWithRefund.call(parameters)],
    }),
  prepareHcaSession,
);

export type { EnableHcaSessionWithRefundParameters } from "./types.js";
