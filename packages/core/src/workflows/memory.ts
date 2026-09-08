import { WorkflowError } from "../errors/workflow-error.js";
import type { WorkflowStorage, WorkflowStoredRecord } from "./storage.js";

/** Atomic in one process; state is lost when this adapter instance is discarded. */
export const createMemoryWorkflowStorage = (): WorkflowStorage => {
  const records = new Map<string, WorkflowStoredRecord>();

  return {
    kind: "workflow-storage",
    async create({ namespace, record }) {
      if (!namespace || !record.id || record.revision !== 0)
        throw new WorkflowError({
          code: "INVALID_STATE",
          message: "New records require a namespace, ID, and revision zero",
        });

      const key = JSON.stringify([namespace, record.id]);
      if (records.has(key)) return false;

      records.set(key, { ...record });
      return true;
    },
    async get({ namespace, id }) {
      const record = records.get(JSON.stringify([namespace, id]));
      return record ? { ...record } : null;
    },
    async compareAndSwap({ namespace, id, expectedRevision, record }) {
      if (
        record.id !== id ||
        !Number.isSafeInteger(expectedRevision) ||
        expectedRevision < 0 ||
        record.revision !== expectedRevision + 1
      )
        throw new WorkflowError({
          code: "INVALID_STATE",
          message: "Updates must preserve ID and increment revision once",
        });

      const key = JSON.stringify([namespace, id]);
      if (records.get(key)?.revision !== expectedRevision) return false;

      records.set(key, { ...record });
      return true;
    },
  };
};
