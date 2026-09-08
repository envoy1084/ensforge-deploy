import { HcaError } from "@ensforge/core";
import type { HcaStorage, HcaStoredRecord } from "@ensforge/core/hca";

/** Development storage: atomic within one process, without restart durability. */
export const createMemoryHcaStorage = (): HcaStorage => {
  const namespaces = new Map<string, Map<string, HcaStoredRecord>>();

  return {
    kind: "hca-storage",
    create: async ({ namespace, record }) => {
      if (record.revision !== 0 || !namespace || !record.id)
        throw new HcaError({
          code: "INVALID_PARAMETERS",
          message: "New HCA records need a namespace, ID and revision zero",
        });

      const records = namespaces.get(namespace) ?? new Map<string, HcaStoredRecord>();

      if (records.has(record.id)) return false;

      records.set(record.id, { ...record });
      namespaces.set(namespace, records);

      return true;
    },
    get: async ({ namespace, id }) => {
      const saved = namespaces.get(namespace)?.get(id);

      return saved ? { ...saved } : null;
    },
    compareAndSwap: async ({ namespace, id, expectedRevision, record }) => {
      if (record.id !== id || record.revision !== expectedRevision + 1)
        throw new HcaError({
          code: "INVALID_PARAMETERS",
          message: "HCA updates must preserve ID and increment revision once",
        });

      const records = namespaces.get(namespace);
      const saved = records?.get(id);

      if (!saved || saved.revision !== expectedRevision) return false;

      records?.set(id, { ...record });

      return true;
    },
  };
};

export type { HcaStorage, HcaStoredRecord } from "@ensforge/core/hca";
