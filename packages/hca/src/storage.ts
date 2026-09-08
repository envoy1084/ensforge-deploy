import { createMemoryWorkflowStorage } from "@ensforge/core";
import type { HcaStorage } from "@ensforge/core/hca";

/** Preserve the legacy discriminator for existing HCA consumers. */
export const createMemoryHcaStorage = (): HcaStorage => ({
  ...createMemoryWorkflowStorage(),
  kind: "hca-storage",
});

export type { HcaStorage, HcaStoredRecord } from "@ensforge/core/hca";
