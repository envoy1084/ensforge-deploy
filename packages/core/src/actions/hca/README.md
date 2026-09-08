# HCA actions (P1–P2)

Import actions from `@ensforge/core/hca` or use `sdk.hca` on the existing `Ensforge` instance.
The 16 finite actions have a Promise and `.effect` form. `watchHcaExecution` adds a callback API and `.stream`. Reads also expose `.request` for `readBatch`.
`deployHca.call` creates a factory intent. Execution and direct owner revocation are lifecycle actions
and do not expose `.call`.

## Configuration and account identity

The recorded Sepolia V2 deployment automatically selects the P0 HCA profile. `createConfig` also
accepts `hca: HcaDeploymentProfile` for an explicitly configured matching deployment. Local devnet
configs already include `devnet.deployments.hca`. Unsupported chains and mismatched ENS/HCA contract
addresses fail before writes. P1 supports the pinned initial implementation; an upgraded account
requires a separately verified implementation profile.

`hca` is the account address. Supply `salt` for accounts created with a nonzero salt; the default is
zero. Factory deployment is permissionless, while the account owner is immutable. Predictions use
both factory salt layers and the exact Verifiable Factory clone creation code.

| Action                         | Parameters                                                                      | Result                                                            |
| ------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `predictHcaAddress`            | `owner`, optional `salt`, `implementation`, block options                       | Address                                                           |
| `getHca`                       | `hca`, block options                                                            | Deployed state or explicit undeployed state                       |
| `getHcaOwner`                  | `hca`, block options                                                            | Owner or null when undeployed                                     |
| `getHcaImplementation`         | `hca`, block options                                                            | Current implementation or null                                    |
| `getHcaAccountId`              | `hca`, block options                                                            | Account identifier or null                                        |
| `getHcaSessionNonce`           | `hca`, block options                                                            | Nonce or null                                                     |
| `getAuthorizedHcaOwner`        | `hca`, block options                                                            | Factory-certified owner or null                                   |
| `getHcaImplementationApproval` | `implementation`, block options                                                 | Factory deployment approval                                       |
| `verifyHca`                    | `hca`, optional `expectedOwner`, `salt`, `initialImplementation`, block options | Verified account snapshot                                         |
| `getHcaCapabilities`           | Same as verification                                                            | Account and currently supported SDK paths                         |
| `deployHca`                    | `owner`, optional `salt`, `implementation`, wallet overrides, confirmation      | Already deployed, submitted, or confirmed deployment              |
| `prepareHcaCalls`              | `hca`, `authorization`, `calls`, optional `salt`, wallet overrides              | Immutable resolved plan; full execution simulation still required |
| `executeHcaCalls`              | Preparation parameters plus optional `execution`                                | Transaction or adapter submission handle                          |
| `getHcaExecutionStatus`        | `submission`, adapter when applicable                                           | Pending, unknown, succeeded, failed, cancelled, or expired        |
| `waitForHcaExecution`          | Status parameters plus optional timeout, confirmations, polling interval        | Confirmed outcome or typed wait error                             |
| `watchHcaExecution`            | Wait parameters, status/error callbacks, optional run options                   | Unsubscribe function; `.stream` for Effect consumers              |
| `revokeHcaSessions`            | `hca`, optional `salt`, wallet overrides, confirmation                          | Hash and, when confirmed, receipt and observed session nonce      |

A verified snapshot is not a transferable authorization token. Execution always verifies the account
again. Arbitrary incompatible contract code produces an error, not an undeployed result.

## Owner execution

```ts
const submission = await executeHcaCalls(config, {
  hca,
  authorization: { kind: "owner" },
  calls: [setText.call({ name: "alice.eth", key: "url", value: "https://alice.example" })],
});
const result = await waitForHcaExecution(config, { submission });
```

Without `execution`, the connected owner wallet calls `executeByOwner`. Core simulates the entire
atomic batch before sending, even if ordinary writes use a skip policy. This action always returns
a submission handle; use the wait action for confirmation. Inner calls receive the HCA as caller,
so owning a name does not automatically give the HCA resolver permissions. Grant the required ENS
permissions separately with existing actions.

Raw owner calls use `{ to, data?, value? }`. The outer transaction supplies the sum of their values.
P1 rejects self-calls to the HCA; management operations need dedicated validation. ENS semantic
intents retain their normal precondition checks. Batches that need earlier calls to establish later
preconditions (such as creating a resolver before configuring it) require later workflow support.
Existing ENS intent preparation currently uses the configured wallet context; raw adapter calls can
be prepared without a wallet. Provider integration phases will address provider-owned signer context for these preparers.

## Adapter dispatch

With `execution`, core calls `supports → prepare → authorize → submit`. Adapters use the same
Promise/Effect action convention and identify their configuration with `id` and `instanceId`.
Prepared/authorized envelopes retain chain, HCA, profile and plan fingerprint. Complete operation
simulation is mandatory before authorization. Core validates those identities at each boundary and
checks the account again before submission. An adapter failure never falls back to a wallet.

`ExecutionAdapter<Prepared, Authorized, Submission>` preserves provider payload types through the
SDK. The optional [`@ensforge/hca` package](../../../../hca/README.md) implements validated typed
adapters, review summaries, fee/expiry policies, optional extensions and versioned submission codecs.
Pimlico, Alchemy and Rhinestone factories remain later phases. Session authorization is still
rejected, even if an adapter claims support. `requiredCapabilities` rejects unavailable features
before provider preparation; `operationId` is an optional tracking label, not a deduplication key.

Transaction status verifies the receipt's actual transaction sender, target, calldata/value
fingerprint and chain context. Adapter success requires destination receipts, and provider code is
responsible for interpreting UserOperation/intent success correctly. Wait/watch reconcile destination block hashes and confirmations with bounded backoff.
Source-chain receipts must not be supplied as destination receipts. Keep submission handles after timeouts or interruption; retry
status/wait rather than resubmitting. Never retry a failed or uncertain submission automatically.

Direct `deployHca` and `revokeHcaSessions` follow configured confirmation policy. Submitted-only
revocation reports no guessed nonce. Once confirmed, the nonce is read at the receipt block.

Deployment races are reconciled only after verifying the resulting account. If this transaction
reverted because another deployment won, the `already-deployed` result retains its hash and reverted
receipt. Timeouts and uncertain broadcasts remain errors and never trigger automatic resubmission.

`watchHcaExecution` takes wait parameters, `onStatus`, `onError`, and optional run options (including
`signal`), returning an unsubscribe function. Its `.stream(config, parameters)` form is an Effect
Stream. Wait/watch share a total timeout and stop on succeeded/failed/cancelled/expired outcomes;
unknown remains nonterminal. `maxPollingInterval` bounds exponential backoff. Cancelling a wait
or watcher does not cancel the submitted operation. Cancelled/expired statuses require a reason.
