import { Schema } from "effect";

import {
  HcaRegistrationOperation,
  type HcaRegistrationContext,
  type HcaRegistrationProgress,
} from "../../../actions/hca/registration-types.js";
import type { EnsforgeConfig } from "../../../config/config.js";
import { HcaError } from "../../../errors/hca-error.js";

export const loadOperation = async (
  config: EnsforgeConfig,
  context: HcaRegistrationContext,
  id: string,
) => {
  const saved = await context.storage.get(id);

  if (!saved)
    throw new HcaError({
      code: "INVALID_EXECUTION",
      message: "Registration operation was not found",
    });

  const operation = Schema.decodeUnknownSync(Schema.toType(HcaRegistrationOperation), {
    onExcessProperty: "error",
  })(saved);

  if (operation.id !== id || operation.chainId !== config.chainId)
    throw new HcaError({
      code: "INVALID_EXECUTION",
      message: "Registration storage identity or network does not match",
    });

  if (
    operation.route.kind === "adapter"
      ? context.execution?.id !== operation.route.id ||
        context.execution.instanceId !== operation.route.instanceId
      : context.execution !== undefined
  )
    throw new HcaError({
      code: "INVALID_EXECUTION",
      message: "Restore the registration with its original execution adapter configuration",
    });

  return operation;
};

export const saveOperation = async (
  context: HcaRegistrationContext,
  operation: HcaRegistrationOperation,
  progress: HcaRegistrationProgress,
  changes: Partial<
    Pick<
      HcaRegistrationOperation,
      | "limits"
      | "authorization"
      | "signerReference"
      | "commitmentSubmission"
      | "registrationSubmission"
    >
  > = {},
) => {
  const updated = Schema.decodeUnknownSync(Schema.toType(HcaRegistrationOperation), {
    onExcessProperty: "error",
  })({
    ...operation,
    ...changes,
    progress,
    revision: operation.revision + 1,
    updatedAt: BigInt(Date.now()),
  });

  if (
    !(await context.storage.compareAndSwap({
      id: operation.id,
      expectedRevision: operation.revision,
      operation: updated,
    }))
  )
    throw new HcaError({
      code: "INVALID_EXECUTION",
      message: "Registration changed concurrently; reload it before resuming",
    });

  return updated;
};
