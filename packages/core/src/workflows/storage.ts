/** Opaque workflow payload; adapters never receive wallets, signers, or provider credentials. */
export interface WorkflowStoredRecord {
  readonly id: string;
  readonly revision: number;
  readonly value: string;
}

/** Create and compareAndSwap must be atomic across all users of the backend. */
export interface WorkflowStorage {
  readonly kind: "workflow-storage" | "hca-storage";
  create(input: {
    readonly namespace: string;
    readonly record: WorkflowStoredRecord;
  }): Promise<boolean>;
  get(input: {
    readonly namespace: string;
    readonly id: string;
  }): Promise<WorkflowStoredRecord | null>;
  compareAndSwap(input: {
    readonly namespace: string;
    readonly id: string;
    readonly expectedRevision: number;
    readonly record: WorkflowStoredRecord;
  }): Promise<boolean>;
}
