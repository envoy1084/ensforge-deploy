# Execution adapters for HCA

Status: Typed execution contracts, Rhinestone destination sessions, and Pimlico owner execution are implemented. Hosted Pimlico acceptance remains an integration check.
Parent: [HCA integration and phased TODOs](../hca-integration.md).
Core APIs: [HCA actions](core-actions.md).

The shipped APIs are documented in the [core API reference](../../packages/core/src/actions/hca/README.md)
and [adapter package](../../packages/hca/README.md). Code sketches below describe the broader provider
design; use the package reference for exact shipped types and the [Rhinestone guide](../../packages/hca/RHINESTONE.md) for P3 setup.

## 1. Accepted public shape

Expose named factories backed by their provider packages:

```ts
import { pimlico } from "@ensforge/hca/pimlico";
import { rhinestone } from "@ensforge/hca/rhinestone";

const execution = pimlico({
  profile,
  chain,
  owner,
  client: existingPimlicoClient,
  sponsorship: { client: existingPaymasterClient },
});

const sdk = new Ensforge(config);
const submission = await sdk.hca.executeHcaCalls({
  hca,
  execution,
  authorization: { kind: "owner" },
  calls,
});
```

All names are planned APIs. Provider config should accept existing clients/signers. Convenience
construction can be added using the provider's actual types after a version is selected. Do not
invent a universal `apiKey` shape: browser credentials, server credentials, endpoints and policy IDs
have different visibility and permission rules.

There is no public `erc4337` adapter, no `createHcaClient`, and no second ENS config. A provider SDK
may internally require its own account object/client; that is an implementation dependency, not a
new user-facing Ensforge client. An adapter does not own ENS name normalization or resolver routing.

Core defines the minimum structural contracts. Provider implementations return plain immutable
objects/factories, not subclasses. Interfaces provide extensibility without inherited mutable state.

## 2. Separate account encoding from delivery

| Layer                  | Responsibility                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Core HCA semantics     | Verify owner/profile, resolve ENS calls, enforce session policy, preserve wallet name ownership                   |
| HCA account codec      | Deterministic factory data, execution encoding, nonce selection, signature/stub format                            |
| Pimlico integration    | Provider SDK clients, fee estimation, UserOperation preparation/simulation, paymaster data, submission and status |
| Rhinestone integration | Supported HCA SDK configuration, intent/session authorization, quotes, funding and settlement                     |
| Workflow functions     | ENS commitment delay, fresh reveal quote, persistence, reconciliation and recovery                                |

Provider-neutral HCA codecs can live in `@ensforge/hca/account` internally and depend on core
metadata. Existing contract-based actions remain in core. Do not make core instantiate the provider
SDK's smart account types.

The deployed account fixes its validator and executor. `supports` must reject unsupported combinations:
Pimlico's owner UserOperation route does not execute an ENS intent session; a generic Kernel session
is not an ENS HCA session. Future ZeroDev/Kernel or Safe support needs its own account verification
and encoding, not just a different URL.

## 3. Required lifecycle interface

Five required methods: `supports`, `prepare`, `authorize`, `submit`, `getStatus`.
Finite async methods use the existing Promise plus `.effect` convention. Constructors inject external
SDK dependencies so adapter effects do not introduce an unresolved application Effect environment.
The following is a conceptual lifecycle sketch. P2 implements `ExecutionAdapterDefinition` and
`TypedExecutionAdapter` with concrete core Schemas; provider-specific payload schemas arrive with each provider.

```ts
import type { Effect } from "effect";
import type { EnsforgeConfig } from "@ensforge/core";

type AdapterAction<P, S, E> = {
  (config: EnsforgeConfig, parameters: P, options?: Effect.RunOptions): Promise<S>;
  readonly effect: (config: EnsforgeConfig, parameters: P) => Effect.Effect<S, E>;
};

interface ExecutionAdapter<Id extends string, Prepared, Authorized, Submission> {
  readonly id: Id;
  readonly capabilities: ExecutionCapabilities;

  readonly supports: (request: ExecutionSupportRequest) => ExecutionSupport;
  readonly prepare: AdapterAction<ExecutionRequest, Prepared, ExecutionError>;
  readonly authorize: AdapterAction<
    { prepared: Prepared; authorization: AuthorizationContext },
    Authorized,
    ExecutionError
  >;
  readonly submit: AdapterAction<{ authorized: Authorized }, Submission, ExecutionError>;
  readonly getStatus: AdapterAction<{ submission: Submission }, ExecutionStatus, ExecutionError>;
}
```

`ExecutionSupportRequest`, `ExecutionRequest`, `AuthorizationContext`, `ExecutionError` and the
payload envelopes below are core-owned domain types to implement with Schemas. Do not replace them
with provider SDK types in core. `Prepared`, `Authorized` and `Submission` are provider-specific,
opaque types with the common identity/summary fields described below.

| Method      | Required behavior                                                                                                            | Side effects                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `supports`  | Synchronous compatibility check using known account/profile/route data; reason codes for rejection                           | None; not a guarantee about live chain/provider state                                   |
| `prepare`   | Resolve current nonce, factory needs, fee/quote and sponsorship details; perform appropriate simulation; bind immutable plan | RPC/provider requests allowed; no signing, broadcast, token movement or policy creation |
| `authorize` | Collect exactly the authorizations required by the prepared operation                                                        | May prompt wallet/session signer; no broadcast                                          |
| `submit`    | Verify envelope identity/expiry and submit the approved operation                                                            | May sign-and-send through wallet when separate transaction signing is unavailable       |
| `getStatus` | Reconcile provider, transaction and destination outcome                                                                      | Read only; must not resubmit or repair execution                                        |

Authorization distinguishes message signing from wallet sign-and-send. For direct wallet execution,
`authorize` may return a validated wallet capability rather than a serialized signed transaction;
`submit` then triggers the actual wallet transaction prompt. Never add a redundant message signature
to manufacture a common lifecycle. Report pending wallet interactions accurately.

No blind retry around signing or submission. Provider retries may be safe for reads. If broadcast
possibly succeeded but its response was lost, return a submission-uncertain error with available
tracking identifiers; reconcile before requesting another signature or broadcasting again.

## 4. Requests and capability checks

```ts
interface ExecutionCapabilities {
  readonly accountKinds: readonly string[];
  readonly ownerExecution: boolean;
  readonly sessionExecution: boolean;
  readonly counterfactualDeployment: boolean;
  readonly atomicBatching: boolean;
  readonly sponsorship: boolean;
  readonly crossChainFunding: boolean;
}

type ExecutionSupport =
  { supported: true } | { supported: false; reasons: readonly UnsupportedExecutionReason[] };
```

Capabilities are coarse declarations for a verified implementation/version. `supports` checks the
specific account kind, profile, route and desired authorization. `prepare` checks chain, current
implementation, EntryPoint, provider availability and live policy. Do not mark chain support true
because the generic provider serves that chain if its required HCA contracts are absent.

`ExecutionRequest` carries:

- verified or explicitly counterfactual account descriptor, chain and profile;
- immutable core plan ID/fingerprint with ordered resolved target/value/calldata;
- authorization mode: owner or a typed, validated destination session reference;
- atomicity requirement; HCA owner batch/reveal operations require atomic destination execution;
- optional funding requirements with source/destination chain/token and maximum amounts;
- caller-defined operation ID for tracking, not an unproven exactly-once guarantee.

Raw provider preparation receives resolved calls, not `EnsWriteIntent` values. Core performs semantic
routing first. For a batch that deploys then configures a resolver, the plan may include explicit
future-state prerequisites; it must not incorrectly demand preexisting code/roles for later calls.
The whole account operation must be simulated through a supported path before a success claim.

The payer, inner HCA caller, authorizing owner, name recipient and source account are distinct fields.
Do not overload one `account` parameter to mean all five.

## 5. Payload identity, fees and signing

Every prepared envelope has a common review summary plus opaque provider payload:

```ts
interface ExecutionEnvelopeIdentity<Id extends string> {
  readonly adapterId: Id;
  readonly schemaVersion: number;
  readonly configurationFingerprint: string;
  readonly planFingerprint: string;
  readonly chainId: number;
  readonly account: Address;
  readonly profileId: string;
}

interface PreparedExecution<Id extends string, Payload> {
  readonly identity: ExecutionEnvelopeIdentity<Id>;
  readonly payload: Payload;
  readonly expiresAt?: bigint;
  readonly fees: readonly FeeEstimate[];
  readonly authorizations: readonly AuthorizationRequirement[];
  readonly simulation: SimulationEvidence;
}
```

Address, fee, authorization and simulation types here stand for the Schema-backed core types defined
in P2. Payloads use provider-specific nominal/opaque typing. The string `adapterId` alone does not
prevent instance confusion: include chain, account, profile, endpoint/configuration fingerprint and
version checks at every boundary. Do not hash credentials into public fingerprints.

Fee summaries identify registration price, execution fee, bridge/swap costs when applicable,
expected charge versus maximum authorization, sponsorship scope, token/chain and quote expiry.
Never claim gas sponsorship pays the ENS registration price. An ERC20 paymaster may require token
allowance/account calls; prepare and show them before authorization rather than silently injecting
new spend approvals after the user signs.

`SimulationEvidence` records account/chain/block or provider evidence and whether the complete
operation was simulated. Partial inner-call success is not full-batch success. A required simulation
failure rejects preparation. An unavailable simulation is explicit and blocks the affected route
until its verification/exception policy is deliberately implemented; do not weaken ordinary core writes.

Reprepare when material inputs change: quote expiry, call target/value, payment limit, owner, chain,
implementation, session nonce or permissions. Reuse a signature only when the protocol's exact signed
scope still authorizes the unchanged payload. The UI must be able to inspect authorizations before
prompting. Adapter preparation never generates or persists an undisclosed session private key.

## 6. Submission and completion

Common tracking identity plus concrete provider data:

```ts
type ExecutionLocator =
  | { kind: "transaction"; chainId: number; hash: Hex }
  | { kind: "user-operation"; chainId: number; entryPoint: Address; hash: Hex }
  | { kind: "intent"; provider: string; requestId: string };

type ExecutionStatus =
  | { status: "pending"; stage: string; transactions: readonly ExecutionTransaction[] }
  | { status: "succeeded"; transactions: readonly ExecutionTransaction[] }
  | { status: "failed"; failure: ExecutionFailure; transactions: readonly ExecutionTransaction[] }
  | { status: "cancelled"; transactions: readonly ExecutionTransaction[] }
  | { status: "expired"; transactions: readonly ExecutionTransaction[] }
  | { status: "unknown"; reason: string; transactions: readonly ExecutionTransaction[] };
```

A submission includes its adapter identity, locator, operation ID and provider tracking payload.
A transaction/user-operation hash and an intent request ID are not interchangeable. A resumed adapter
validates tracking data with its versioned codec and rechecks account/network identity. Store no API
keys, bearer tokens, wallet handles or signer secrets in submission JSON.

A confirmed successful destination operation is the completion criterion. UserOperation receipt
`success=false` is a failure even if the containing bundle transaction succeeded. Cross-chain source
receipts alone never mean the ENS operation completed. Preserve partial receipts and recovery context.
Report provider outages/timeouts as uncertain status, not definitive failure or cancellation.

Shared SDK helpers implement `waitForHcaExecution` and `watchHcaExecution` over `getStatus` with
bounded polling/backoff, AbortSignal and existing confirmation policy. Providers may optimize with
subscriptions internally. A user-aborted wait must leave a resumable submission handle.

## 7. Optional extensions

Concrete returned adapter types expose extensions only when implemented and compatible:

```ts
const execution = rhinestone(options);

// Shipped session API.
const preparedSession = await execution.extensions.sessions.prepare(sdk.config, sessionRequest);
await execution.extensions.sessions.enable(sdk.config, preparedSession);

// Independent EOA/Permit2 funding with an explicitly reviewed route manifest.
const quote = await execution.crossChain.quoteFunding(sdk.config, fundingRequest);
await execution.crossChain.fund(sdk.config, { quote, storage });
await execution.crossChain.waitForFunding(sdk.config, { id: fundingRequest.id, storage });
// Now run an ordinary same-chain HCA action, using any compatible execution adapter.
```

Each extension uses the same Action/Effect convention and its own typed request/result envelopes:

| Extension      | Candidate methods                                            | Semantics                                                                                                        |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `sessions`     | `prepare`, `authorize`, `getStatus`                          | Provider-specific permission IDs/account setup/proofs; does not automatically enable on-chain state              |
| `crossChain`   | `quoteFunding`, `fund`, `getFundingStatus`, `waitForFunding` | Independently fund the destination HCA; use separate funding tracking and no registration-specific orchestration |
| `sponsorship`  | `estimate`, `getEligibility`                                 | Optional provider-specific controls; ordinary prepare can already include configured sponsorship                 |
| `recovery`     | `getOptions`, `prepare`                                      | Produce an explicit new operation; never silently move funds or switch accounts                                  |
| `cancellation` | `cancel`                                                     | Only when provider can actually cancel; report scope and already-executed stages                                 |
| `lookup`       | `findSubmission`                                             | Reconcile lost responses when provider/chain identifiers make it possible                                        |

Destination HCA revocation stays a core direct-owner action. Source Nexus funding-validator removal
and token allowance revocation are separate operations with separate callers. Do not expose one
ambiguous `sessions.revokeEverything` method.

Rhinestone session policy is the deployed fixed ENS policy, not arbitrary generic Smart Sessions.
Extensions must reject unsupported requested permissions instead of weakening them to a broader policy.
Shared registration workflow functions consume only extensions they require and return unsupported
before signing when an adapter lacks them.

## 8. Named provider implementations and dependencies

### Rhinestone (P3)

Public export: `@ensforge/hca/rhinestone`, factory `rhinestone()`.
ENS's matched source guide uses `@rhinestone/sdk` 1.8.0 with a substantial patch for this standalone
HCA. P3 ships that reproducible patch plus a verified-profile executor-address extension. Stock
1.8.0 is insufficient; do not substitute a generic `owners.type="ens"` example.

Use SDK account version/configuration, fixed destination/source validators, source sessions, permit
handling, quotes, claims/fills and signature formats. Do not recreate the SDK's Permit2, executor or
paymaster protocol encoding in core. The HCA account version, on-chain account ID, initial factory
configuration, resolver and profile must all agree.

P3 offers confirmed destination-session execution and bounded refund configuration. Owner intent
execution and cross-chain routes are not implemented. Those are separate capabilities from owner ERC-4337 execution. Keep first-route enablement,
source-account setup, full destination account configuration and fresh reveal quotes in the integration.

Sources: [ENS integration guide](https://github.com/ensdomains/contracts-v2/blob/09bf3ac64a6fb1b215573c019b17e8c501bb3ca0/docs/HCA.md),
[exact SDK patch](https://github.com/ensdomains/contracts-v2/blob/09bf3ac64a6fb1b215573c019b17e8c501bb3ca0/patches/%40rhinestone%252Fsdk%401.8.0.patch),
[Rhinestone SDK source](https://github.com/rhinestonewtf/sdk).
The guide includes proof deployments with addresses different from the selected artifact profile;
re-run an authorized proof for the exact profile before enabling the route.

### Pimlico (P4)

Public export: `@ensforge/hca/pimlico`, factory `pimlico()`.
Use the provider's `permissionless` package (including Pimlico actions/clients) with viem where needed.
Keep existing clients injectable. The account is ENS HCA, not a default Safe/Kernel created by a sample.
Pimlico supplies bundler/paymaster infrastructure; it does not supply this account's validation logic.

Proof sequence: read supported EntryPoints → deployed funded HCA owner UserOperation → undeployed HCA
factory setup → fee estimation with correct stub signature → optional sponsored operation → failed
operation/timeout reconciliation. Match HCA nonce modes, signature encoding and allowed execution
selectors from the verified source. Session/cross-chain support stays absent for this HCA.

Sources: [Pimlico infrastructure](https://docs.pimlico.io/),
[permissionless source](https://github.com/pimlicolabs/permissionless.js).
The [implemented Pimlico API](../../packages/hca/PIMLICO.md) uses permissionless 0.4, explicit owner
signing, nonce key zero, optional sponsorship, and first-operation factory deployment. Local
EntryPoint proofs do not certify hosted bundler validation policy or real sponsorship.

### Future ZeroDev and other accounts

Reserve no public `zerodev()` export until implementation exists. Kernel's permission model belongs
to Kernel; it does not change the fixed ENS HCA validator. Decide whether a future integration uses
provider infrastructure with the ENS account or introduces another account implementation. Verify
factory certification requirements of HCA-aware ENS methods before exposing them for other accounts.

Source: [ZeroDev permissions](https://docs.zerodev.app/smart-accounts/permissions/intro).
Broader provider/account support must not require refactoring core around one provider's session types.

## 9. Files, errors and implementation acceptance

```text
packages/core/src/execution/        interfaces, schemas, summaries, tracking helpers
packages/core/src/actions/hca/      contract actions and semantic plan preparation
packages/sdk/src/groups/hca.ts      bindings on the existing Ensforge class
packages/hca/src/account/           account encoding shared where genuinely applicable
packages/hca/src/pimlico/           concrete provider adapter, payloads, fees, status
packages/hca/src/rhinestone/        account integration, sessions, routes, funding, status
packages/hca/src/registration/      stateless start/resume orchestration functions
packages/hca/src/storage/           versioned operation-store contract; adapters as needed
```

Avoid creating empty files or generic manager layers for this entire tree at once. Add responsibilities
when their phase is implemented. Keep provider libraries as optional peers, with pinned dev versions
for repeatable compatibility work; isolate runtime imports to the provider subpaths.

Candidate stable error codes: `UNSUPPORTED_ACCOUNT`, `UNSUPPORTED_EXECUTION_PATH`,
`ENTRY_POINT_UNSUPPORTED`, `PROFILE_MISMATCH`, `ADAPTER_MISMATCH`, `QUOTE_EXPIRED`,
`SIMULATION_FAILED`, `SIMULATION_UNAVAILABLE`, `AUTHORIZATION_REJECTED`, `PAYMASTER_REJECTED`,
`SUBMISSION_UNCERTAIN`, `EXECUTION_REVERTED`, `PROVIDER_UNAVAILABLE`, `RESTORE_VERSION_UNSUPPORTED`.
Translate provider errors once, preserve safe diagnostics, and keep secret payloads out of logs.

Acceptance requires observed same-account execution across the named providers, import isolation,
correct provider-specific typing, authorization-bound payload integrity, failure/status reconciliation,
and documented versions. Do not publish unverified capability flags. The implementation order and
phase exit criteria live in the [main TODO plan](../hca-integration.md#8-phased-todos).

## Independent funding boundary

The concrete Rhinestone adapter exposes `execution.crossChain` directly for configured EOA/Permit2 routes.
Pimlico and the shared `ExecutionAdapter` need no cross-chain methods. Source funding must settle
before the application invokes ordinary destination registration. The funding adapter and subsequent
execution adapter can differ. P5 storage contains no bridge route and makes no source transaction.
Use a separate funding record for claims, settlement, and recovery in the same `HcaStorage` backend,
under a distinct namespace. See [the shipped funding API](../../packages/hca/FUNDING.md).
Public manifests and hosted settlement proofs remain release gates;
older combined funding-and-registration sketches are superseded.
