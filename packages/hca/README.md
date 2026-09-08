# @ensforge/hca

Optional, Effect-native execution adapter infrastructure for ENS HCA accounts. ENS actions remain in
`@ensforge/core` and on the existing `sdk.hca` group. This package does not create another ENS client.

This package supplies typed execution contracts, persistence and the
[`rhinestone()` destination-session adapter](RHINESTONE.md), using an optional, patched Rhinestone
1.8.0 peer, plus the [`pimlico()` owner UserOperation adapter](PIMLICO.md) with optional sponsorship
and first-operation deployment. Root and Pimlico imports do not load Rhinestone.

The [resumable registration guide](REGISTRATION.md) covers the existing `sdk.hca` workflow actions,
caller-owned storage, spending limits, and recovery.

## Using an adapter

With a compatible adapter supplied by your integration:

```ts
const submission = await sdk.hca.executeHcaCalls({
  hca,
  authorization: { kind: "owner" },
  calls,
  execution,
  operationId: "update-profile-42",
  requiredCapabilities: ["atomicBatching"],
});

// Concrete provider submission payload and locator types remain available here.
const serialized = execution.serializeSubmission(submission);
const expected = {
  chainId: submission.chainId,
  hca: submission.hca,
  profileId: submission.profileId,
  planFingerprint: submission.planFingerprint,
};
// Persist serialized and the trusted expected operation in application-owned storage.
const restored = execution.restoreSubmission(serialized, expected);
const result = await sdk.hca.waitForHcaExecution({ submission: restored, execution });
```

Omitting `execution` retains direct owner-wallet execution. An adapter failure never causes wallet
fallback. `operationId` is a correlation label, not an exactly-once submission guarantee.

`restoreSubmission` is synchronous and performs no network requests. It validates codec/envelope
versions, adapter configuration, chain, account, profile, fingerprint, and tracking payload shape.
Recreate the adapter with the same public configuration after a restart. The expected operation must
come from trusted application state, not values copied out of untrusted JSON. A codec is validation,
not cryptographic proof: the provider must reconcile its locator with the actual destination outcome.

## Implementing an adapter

Use `createExecutionAdapter` with an `ExecutionAdapterDefinition<Prepared, Authorized, Submission>`.
All five lifecycle methods use the existing `defineAction` Promise plus `.effect` convention.
Provider callbacks return their own typed payloads; the wrapper adds and validates shared envelopes.

| Definition field                          | Purpose                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `id`, `chainId`, `profileId`              | Provider name and the exact supported destination context                  |
| `configurationFingerprint`                | Stable bytes32 digest of public configuration; also the core `instanceId`  |
| `capabilities`, `supports`                | Coarse capabilities and operation-specific compatibility                   |
| `schemas.prepared`, `schemas.authorized`  | Effect schemas for decoded provider payloads                               |
| `submission.version`, `submission.schema` | Versioned codec for public, resumable tracking data                        |
| `prepare`                                 | Full operation simulation; returns `{ payload, review }`                   |
| `authorize`                               | Receives a prepared envelope; returns the authorized provider payload      |
| `submit`                                  | Receives an authorized envelope; returns `{ reference, locator, payload }` |
| `getStatus`                               | Receives a validated submission; returns an execution outcome              |
| `policy`                                  | Optional expiry requirement and aggregate fee limits by kind/chain/token   |
| `extensions`                              | Optional, concretely typed provider features                               |

Use Effect `Schema.Codec` values for the payloads. For example,
`Schema.Struct({ userOperationHash: HcaExecutionHash, nonce: Schema.BigInt })` retains a bigint in
memory and encodes it for JSON automatically. Whitelist tracking fields; do not use `Schema.Unknown`
as the entire submission payload. Unknown excess fields are rejected when restoring. Store no signed
operations, secret keys, API credentials, signer objects, or wallet handles in submission data.

Derive the configuration fingerprint from the chain, HCA profile, EntryPoint/account version, public
endpoint identifier and relevant policy settings. Never hash credentials into public identifiers.
Schema/version changes require an explicit codec version change; incompatible versions fail closed.

### Review and authorization

Every prepared envelope includes `review`:

- `expiresAt`: optional Unix seconds; checked before authorization and again before submission.
- `fees`: registration, execution, bridge or swap estimates, each with chain/token, expected amount,
  maximum amount and sponsorship flag. Values use token base units.
- `authorizations`: signer, interaction kind, human-readable description and provider signing-scope hash.
- `simulation`: full-operation evidence bound to the destination chain/account, optionally a block.

Use `policy.requireExpiry` for expiring quotes and `policy.feeLimits` for strict budgets. An empty
fee-limit list rejects every reported fee. Matching maxima are summed, so splitting a fee into
multiple entries cannot bypass the budget. Sponsoring execution does not imply paying ENS prices.
Providers remain responsible for deriving accurate fees and binding their encoded operation to the
reviewed limits; the wrapper cannot inspect an arbitrary provider signing format.

Applications can review `await execution.prepare(config, plan)` before explicitly calling
`execution.authorize(config, prepared)` and `execution.submit(config, authorized)`. The one-step SDK
action runs the same lifecycle. A direct wallet route may authorize a wallet capability and prompt
for a transaction during submission; no redundant message signature is required.

The wrapper validates resolved call fingerprints, rechecks the account implementation/owner/session
nonce, freezes validated envelopes, rejects cross-instance authorization, and rejects a second
submission attempt for the same authorized envelope. Prepared/authorized envelopes are local to the
adapter instance and cannot be restored. Submission tracking survives restarts.

A submit error is `SUBMISSION_UNCERTAIN`: retain its cause and available provider references and
reconcile before attempting a new operation. No automatic retry wraps signing or submission. This
in-memory guard does not replace durable application coordination across tabs, processes or restarts.

### Status, waiting and watching

Outcomes are `pending`, `unknown`, `succeeded`, `failed`, `cancelled`, or `expired`. The latter two
require a reason and actual provider evidence; an outage is not cancellation. Successful destination
receipts are required for success. A failed UserOperation is failed even when its bundle transaction
succeeded. Report destination receipts only; source-chain completion is not destination success.

Core supplies bounded exponential polling with `pollingInterval`, `maxPollingInterval`, `timeout`,
and `confirmations`. Timeout covers the whole wait, including provider calls. Receipt block hashes
are checked against the current destination chain before reporting confirmed success or failure.
Unknown remains nonterminal. Waiting never resubmits.

```ts
const controller = new AbortController();
const stop = await sdk.hca.watchHcaExecution(
  { submission, execution, timeout: 120_000 },
  (status) => console.log(status.status),
  (error) => console.error(error),
  { signal: controller.signal },
);
stop(); // Or controller.abort(); neither cancels the on-chain execution.

// Effect consumers:
const statuses = sdk.hca.watchHcaExecution.stream({ submission, execution });
```

`waitForHcaExecution` accepts the standard action run options, including `signal`. Both helpers keep
submission handles resumable after interruption. Watch callbacks receive polling snapshots and stop
at a terminal outcome; Stream consumers control their own interruption and subscription lifetime.

### Optional features

`ExecutionExtensions` reserves `sessions`, `crossChain`, `sponsorship`, `recovery`, `cancellation`,
and `lookup`. Each concrete adapter retains its own method and payload types. Use
`requireExecutionExtension(execution, "lookup")` before starting a workflow that needs it. Missing
extensions fail synchronously before signing. Existing capability declarations do not implement a
feature or prove compatibility with the deployed HCA.

The shared wrapper supports deployed-account owner and validated destination-session execution.
Counterfactual execution and cross-chain routes require later provider proofs. Existing semantic ENS call preparers still
require their configured wallet context; raw adapter calls do not. HCA account management and direct
owner session revocation remain core actions.
