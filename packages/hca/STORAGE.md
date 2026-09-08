# Shared HCA storage

Use one `HcaStorage` instance for registration, Rhinestone funding, and future HCA workflows:

```ts
import { createMemoryHcaStorage } from "@ensforge/hca";

const storage = createMemoryHcaStorage(); // Development only.

await execution.crossChain.fund(config, { quote, storage });
await sdk.hca.startHcaRegistration({ ...registration, storage });
```

Core owns the interface, and `@ensforge/hca` re-exports it. No database library, provider credentials,
or signing keys belong in this layer. Actions select their namespace automatically:

| Workflow           | Namespace            | Payload                                                                     |
| ------------------ | -------------------- | --------------------------------------------------------------------------- |
| ENS registration   | `ens/registration`   | Versioned registration JSON, including its commitment secret                |
| Rhinestone funding | `rhinestone/funding` | Versioned route, amount, nonce, signature hash and provider identifier JSON |

The same operation ID can exist in both namespaces. A record's schema belongs to its workflow;
sharing a backend does not create a union of all possible workflow fields.

## Backend interface

```ts
interface HcaStoredRecord {
  readonly id: string;
  readonly revision: number;
  readonly value: string;
}

interface HcaStorage {
  readonly kind: "hca-storage";
  create(input: { namespace: string; record: HcaStoredRecord }): Promise<boolean>;
  get(input: { namespace: string; id: string }): Promise<HcaStoredRecord | null>;
  compareAndSwap(input: {
    namespace: string;
    id: string;
    expectedRevision: number;
    record: HcaStoredRecord;
  }): Promise<boolean>;
}
```

Use `(tenant, namespace, id)` as the primary key in a multi-user backend. Bind tenant authentication
outside this interface; a client-supplied namespace or ID is not authorization.

- `create` atomically inserts revision zero only if absent. Return `false` for a conflict.
- `get` returns a detached envelope or `null`. Return the exact serialized string without re-encoding it.
- `compareAndSwap` updates only when the current revision matches `expectedRevision`. Preserve the ID
  and increment the revision exactly once. Return `false` if another writer won.
- Throw storage failures; do not translate an unavailable database into a missing record or conflict.
- Persist before acknowledging writes. A read-then-write sequence without a transaction is insufficient.

SQL implementations can use an insert with conflict handling and an update conditioned on both
primary key and revision; the affected-row count determines success. IndexedDB can use one read/write
transaction. Plain `localStorage` does not provide atomic updates across tabs.

`scopeHcaStorage` from `@ensforge/core/hca` binds a workflow namespace and codec. It checks the
payload's ID/revision against its outer envelope and rejects malformed records. Applications normally
pass the unscoped store to actions; they do not call this helper directly.

## Lifecycle and compatibility

The in-memory implementation is atomic within one JavaScript process and loses records on restart.
Supply a persistent backend for browser reloads or worker recovery. Protect registration records until
reveal because they contain the commitment secret. Neither funding records nor registration records
contain private keys, provider API keys, or signed permits.

Keep unresolved submission records. Deleting a record can defeat idempotency and permit duplicate
operations. The store deliberately has no automatic expiry or deletion policy.

Existing `HcaRegistrationStorage` implementations remain accepted by registration actions.
`createMemoryHcaRegistrationStorage` remains available as a compatibility entry point backed by the
common store. New integrations should pass `HcaStorage` directly. Existing saved registration JSON
can be migrated into `ens/registration` while preserving its ID, revision and value, before enabling
writers against the new backend.
