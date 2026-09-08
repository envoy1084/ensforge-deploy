# Resumable HCA registration

The existing `sdk.hca` group provides `startHcaRegistration`, `getHcaRegistration`,
`resumeHcaRegistration`, and `cancelHcaRegistration`. Core owns the workflow and storage contract;
`@ensforge/hca` re-exports the contract and provides serialization and development storage.
No additional SDK client or database dependency is required.

Use the same [HCA storage backend](./STORAGE.md) for registration and independent funding.
Legacy registration-only storage implementations remain compatible.

## Start and resume

```ts
import { createMemoryHcaStorage } from "@ensforge/hca";

// Use transactional persistent storage in production.
const storage = createMemoryHcaStorage();

let operation = await sdk.hca.startHcaRegistration({
  id: registrationId, // Application-generated idempotency key.
  hca,
  name: "alice.eth",
  duration: 31536000n,
  resolver,
  paymentToken,
  authorization: { kind: "owner" },
  execution, // Optional Pimlico adapter; omit for the configured owner wallet.
  storage,
  limits: {
    registrationPrice: maximumTokenPrice,
    fees: [{ kind: "execution", chainId, token: "native", maximum: maximumGasCost }],
  },
  primaryName: false,
});

operation = await sdk.hca.getHcaRegistration({ id: registrationId, storage, execution });

// After the commitment wait, or after reopening the application:
operation = await sdk.hca.resumeHcaRegistration({ id: registrationId, storage, execution });
```

The HCA and its permissioned resolver must already be deployed. The resolver must grant ALL root
roles to the HCA. The registrant is always the HCA's immutable owner. Session routes additionally
require `signerReference` and a confirmed session authorization:

```ts
authorization: { kind: "session", permissionId, enableTransactionHash },
signerReference: "vault/ens-session-42",
```

The application supplies the signer through the recreated Rhinestone adapter; storage never resolves
or contains a private key. The session must be bound to the selected resolver. Completing or locally
cancelling registration does not revoke the session, delete its key, or remove the HCA's resolver roles.

The commit and reveal are separate atomic executions. Reveal resets and sets an exact token approval,
registers the name, and grants the immutable owner ALL root resolver roles. `primaryName: true` also
sets the forward ETH address to that owner and invokes `setNameWithHCA` in the same batch. Use a
resolver whose shared root authority you intend to grant to this owner.

## Progress and spending

Progress is a discriminated union: `created`, `submitted`, `submitting`, `waiting`, `needs-review`,
`needs-funding`, `needs-authorization`, `registered`, `failed`, `expired`, or `cancelled`.
`start` may return `submitted` before the commitment transaction is mined. `get` reconciles receipts
without signing or broadcasting. `resume` advances at most one execution step per call; it never
sleeps through the commitment delay or schedules background work.

Registration prices and provider quotes are refreshed before each eligible step. Quotes above the
saved limits return `needs-review`; accept new limits explicitly:

```ts
await sdk.hca.resumeHcaRegistration({ id, storage, execution, limits: newlyAcceptedLimits });
```

Execution fee limits are grouped by kind, chain, and token. Include each fee the provider reports;
sponsored zero-cost execution still needs a matching zero-or-higher limit. Registration fee reviews
use `limits.registrationPrice` for the selected token. Funding checks report the required balance.
Provider estimation can itself fail for insufficient gas funding or sponsorship; the saved operation
remains resumable after resolving that error. Native adapter funding is validated by the provider, including EntryPoint deposits where supported;
core does not assume that every provider pays gas from the same balance.

A renewed session can be supplied explicitly with `authorization` and `signerReference` on resume.
The account, owner, registration inputs, and execution adapter identity remain fixed. RPC/provider
failures are errors, not successful progression. `failed` and `expired` operations never retry
silently. Create a new operation with a fresh secret when appropriate.

## Storage and serialization

```ts
interface HcaRegistrationStorage {
  create(operation: HcaRegistrationOperation): Promise<boolean>;
  get(id: string): Promise<HcaRegistrationOperation | null>;
  compareAndSwap(parameters: {
    id: string;
    expectedRevision: number;
    operation: HcaRegistrationOperation;
  }): Promise<boolean>;
}
```

`create` inserts only absent IDs. `compareAndSwap` must atomically replace the record only when its
revision matches, incrementing the revision by one. Return `false` on conflicts. Reads and writes
must use independent copies. A SQL conditional update or IndexedDB transaction provides these
semantics; independent localStorage reads/writes do not. The in-memory adapter is atomic only within
one JS process and loses all state on restart.

Use `serializeHcaRegistration` and `restoreHcaRegistration` for a versioned JSON representation with
bigint support. Malformed records, unsupported versions, and extra fields are rejected. Treat the
storage as trusted application state and bind access to the authenticated user. **The serialized
record contains the commitment secret** and must be protected until reveal. It contains no wallet or
session private keys, provider credentials, or signed provider operations. `createdAt`/`updatedAt`
are milliseconds; on-chain commitment `readyAt`/`expiresAt` are seconds.

The workflow persists input and secret before sending the commitment. It atomically claims a
`submitting` state before broadcasting either step. Concurrent resume attempts can prepare or prompt
for authorization, but only the successful revision claimant can broadcast. On conflict, reload.

## Lost responses and cancellation

A crash or error after the durable claim can leave `submitting` without a tracking reference. This
state is deliberately not unlocked on a timer: the transaction might have been sent. A saved Pimlico
attempt includes its deterministic UserOperation hash; other routes may require wallet/provider
history. Reconcile externally, then supply the recovered SDK submission:

```ts
await sdk.hca.resumeHcaRegistration({ id, storage, execution, submission: recoveredSubmission });
```

The workflow validates the submission against the saved step, account, route, and plan fingerprint.
It does not persist opaque adapter payloads: it calls the adapter's whitelist-based submission codec.
A missing response, unknown receipt, or lost commitment secret is never permission to resend.
A pre-broadcast interruption can also require manual reconciliation; P5 prioritizes avoiding duplicate
side effects over automatically abandoning uncertain attempts.

`cancelHcaRegistration` stops local progression while keeping inputs and prior tracking. Reconcile
submitted/uncertain operations first. Cancellation cannot undo a commitment, reverse a transaction,
revoke a session, or cancel a bridge. Cancellation racing with preparation wins through the revision
check; cancellation after the submission claim is rejected.

## Funding boundary

This workflow only registers on the destination chain. Fund the HCA through a transfer or a separately
verified funding provider, then resume it. The proposed Rhinestone `execution.crossChain` capability
belongs to independent funding and tracking; registration never triggers it. Funding through
Rhinestone and registering through Pimlico is compatible with this separation.
