import { HcaError } from "../../errors/hca-error.js";

/** Opaque, versioned workflow payload. Never store a signer or provider credential. */
export interface HcaStoredRecord {
  readonly id: string;
  readonly revision: number;
  readonly value: string;
}

/** A single backend for HCA workflows. Namespace and ID together form the primary key. */
export interface HcaStorage {
  readonly kind: "hca-storage";
  create(input: { readonly namespace: string; readonly record: HcaStoredRecord }): Promise<boolean>;
  get(input: { readonly namespace: string; readonly id: string }): Promise<HcaStoredRecord | null>;
  compareAndSwap(input: {
    readonly namespace: string;
    readonly id: string;
    readonly expectedRevision: number;
    readonly record: HcaStoredRecord;
  }): Promise<boolean>;
}

/** Bind a workflow codec without leaking its schema into the persistence backend. */
export const scopeHcaStorage = <Record extends { readonly id: string; readonly revision: number }>(
  storage: HcaStorage,
  namespace: string,
  codec: {
    readonly encode: (record: Record) => string;
    readonly decode: (value: string) => Record;
  },
) => ({
  create: async (operation: Record): Promise<boolean> => {
    if (operation.revision !== 0)
      throw new HcaError({
        code: "INVALID_PARAMETERS",
        message: "New HCA records must start at revision zero",
      });

    return storage.create({
      namespace,
      record: { id: operation.id, revision: operation.revision, value: codec.encode(operation) },
    });
  },
  get: async (id: string): Promise<Record | null> => {
    const saved = await storage.get({ namespace, id });

    if (!saved) return null;

    const decoded = codec.decode(saved.value);

    if (saved.id !== id || decoded.id !== id || decoded.revision !== saved.revision)
      throw new HcaError({
        code: "INVALID_EXECUTION",
        message: "HCA storage envelope and workflow identity differ",
      });

    return decoded;
  },
  compareAndSwap: async ({
    id,
    expectedRevision,
    operation,
  }: {
    readonly id: string;
    readonly expectedRevision: number;
    readonly operation: Record;
  }): Promise<boolean> => {
    if (operation.id !== id || operation.revision !== expectedRevision + 1)
      throw new HcaError({
        code: "INVALID_PARAMETERS",
        message: "HCA updates must preserve ID and increment revision once",
      });

    return storage.compareAndSwap({
      namespace,
      id,
      expectedRevision,
      record: { id, revision: operation.revision, value: codec.encode(operation) },
    });
  },
});
