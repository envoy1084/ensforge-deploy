import { Schema } from "effect";

import { HcaError } from "@ensforge/core";
import { HcaRegistrationOperation, type HcaRegistrationStorage } from "@ensforge/core/hca";

const registrationJson = Schema.fromJsonString(Schema.toCodecJson(HcaRegistrationOperation));

/** This serialization contains the commitment secret. Protect it until reveal. */
export const serializeHcaRegistration = (operation: HcaRegistrationOperation): string => {
  try {
    const validated = Schema.decodeUnknownSync(Schema.toType(HcaRegistrationOperation), {
      onExcessProperty: "error",
    })(operation);

    return Schema.encodeSync(registrationJson)(validated);
  } catch (cause) {
    throw new HcaError({
      code: "INVALID_PARAMETERS",
      message: "Cannot serialize HCA registration",
      cause,
    });
  }
};

export const restoreHcaRegistration = (serialized: string): HcaRegistrationOperation => {
  try {
    return Schema.decodeUnknownSync(registrationJson, { onExcessProperty: "error" })(serialized);
  } catch (cause) {
    throw new HcaError({
      code: "INVALID_PARAMETERS",
      message: "Invalid or unsupported saved HCA registration",
      cause,
    });
  }
};

/** Development storage only: atomic within one JS process, with no restart persistence. */
export const createMemoryHcaRegistrationStorage = (): HcaRegistrationStorage => {
  const operations = new Map<string, string>();

  return {
    create: async (operation) => {
      if (operation.revision !== 0 || operations.has(operation.id)) return false;

      operations.set(operation.id, serializeHcaRegistration(operation));

      return true;
    },
    get: async (id) => {
      const saved = operations.get(id);

      return saved === undefined ? null : restoreHcaRegistration(saved);
    },
    compareAndSwap: async ({ id, expectedRevision, operation }) => {
      const saved = operations.get(id);

      if (saved === undefined || restoreHcaRegistration(saved).revision !== expectedRevision)
        return false;

      if (operation.id !== id || operation.revision !== expectedRevision + 1)
        throw new HcaError({
          code: "INVALID_PARAMETERS",
          message: "Registration updates must preserve ID and increment revision once",
        });

      operations.set(id, serializeHcaRegistration(operation));

      return true;
    },
  };
};
