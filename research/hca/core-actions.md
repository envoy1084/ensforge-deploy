# HCA core actions and SDK API

Status: P1 owner actions implemented; later session, account and governance APIs remain proposed.
Parent: [HCA research and phased TODOs](../hca-integration.md).
Provider contract: [Execution adapters](execution-adapters.md).

The shipped 16-action P1 surface and exact return types are documented in the
[P1 API reference](../../packages/core/src/actions/hca/README.md). The inventory below also includes
future phases; it is not a claim that all listed methods are available.

## 1. Conventions and boundaries

Every finite network action uses `EnsforgeConfig` and an Effect implementation with the standard
Promise facade. Reads expose `.request`; writes expose `.call` only when safe to compose in the
existing semantic write planner. Pure deterministic helpers stay synchronous. Execution supports
cancellation through existing Effect run options; cancelling a local wait does not cancel a chain write.

```ts
import { getHcaOwner } from "@ensforge/core/hca";

const owner = await getHcaOwner(config, { hca });
const program = getHcaOwner.effect(config, { hca });
const bound = await sdk.hca.getHcaOwner({ hca });
const request = sdk.hca.getHcaOwner.request({ hca });
```

A read descriptor must not perform RPC, validate mutable account state or resolve a provider when
constructed. Parameters include the existing mutually exclusive `BlockParameters` where meaningful.
Aggregate reads use a shared snapshot; focused reads do not fetch the aggregate then discard fields.

Public types use `Address`, `Hex`, existing ENS call-intent types, and Effect Schemas. Native/token
amounts, salts, role bitmaps, nonces and Unix timestamp seconds use `bigint`; validate ABI widths.
`permissionId` is exactly bytes32, not an arbitrary-length Hex. Never accept a private key in a core
HCA action. Signer capabilities are supplied separately at authorization time.

The `hca` parameter is a contract address. It is not an SDK instance. The account's authorizing wallet
and the HCA's address are distinct. For writes, resolve a verified account descriptor before encoding.

## 2. Account reads, prediction and verification

| Action                         | Main inputs                                                 | Result / underlying operation                                                   |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `predictHcaAddress`            | `owner`, optional profile-approved `implementation`, `salt` | Address plus complete initial derivation inputs; may resolve proxy logic by RPC |
| `getHca`                       | `hca`, block options                                        | `undeployed` or `deployed` aggregate; does not label arbitrary code verified    |
| `getHcaOwner`                  | `hca`, block options                                        | Owner from `owner()`; null only for a valid undeployed address                  |
| `getHcaImplementation`         | `hca`, block options                                        | Current implementation, cross-checked with Verifiable Factory where required    |
| `getHcaAccountId`              | `hca`, block options                                        | On-chain `accountId()` string                                                   |
| `getHcaSessionNonce`           | `hca`, block options                                        | Owner and nonce from `ownerAndSessionNonce()`                                   |
| `getAuthorizedHcaOwner`        | `hca`, block options                                        | Factory `authorizedOwnerOf`; zero becomes null                                  |
| `getHcaImplementationApproval` | `implementation`, block options                             | Factory `approvedImplementations`, explicitly not upgrade-gate approval         |
| `isHcaImplementationTrusted`   | `implementation`, block options                             | Historical trusted-set inspection only; not an active HCA authorization check   |
| `verifyHca`                    | `hca`, `expectedOwner`, initial derivation inputs           | Verified descriptor or typed verification failure                               |
| `getHcaCapabilities`           | `hca`, optional authorization context                       | Account capabilities and reasons; provider capabilities are checked separately  |

Use `predictHcaAddress` as a network action when deployment data must be read. An internal pure
address derivation helper accepts complete resolved inputs. Do not label an RPC-dependent operation
pure or expose a second public helper without a demonstrated use case.

Illustrative result shapes:

```ts
type HcaState =
  | { status: "undeployed"; address: Address; chainId: number }
  | {
      status: "deployed";
      address: Address;
      chainId: number;
      owner: Address;
      implementation: Address;
      accountId: string;
      sessionNonce: bigint;
    };

interface VerifiedHcaAccount {
  readonly kind: "ens-hca";
  readonly address: Address;
  readonly owner: Address;
  readonly chainId: number;
  readonly profileId: string;
  readonly initialImplementation: Address;
  readonly currentImplementation: Address;
  readonly userSalt: bigint;
  readonly verifiedAtBlock: bigint;
}
```

These are explanatory structural views; implementation should use an opaque verified descriptor.
Deserialized descriptors require validation/re-verification. A TypeScript cast is not proof of account
identity. `getHca` returns RPC/contract errors for incompatible code; verification returns a typed
mismatch rather than pretending the address is undeployed. Do not infer an owner when no code exists.

P0 established that the default validator is omitted from Nexus’s installed-validator list. Verify
its compiler-recorded immutable binding with the runtime template; do not treat `isModuleInstalled`
returning false as a missing default validator. `TrustedHCASet` is historical metadata in this generation.

`verifyHca` checks deterministic address, owner, account ID, factory certification, recognized current
implementation, gates and fixed wiring as required by the selected profile. Verification has a block
snapshot and is not an indefinite authorization guarantee. Recheck relevant state at preparation.

## 3. Deployment and execution

### `deployHca`

```ts
const result = await sdk.hca.deployHca({
  owner: walletAddress,
  salt: 0n,
  // implementation defaults to the verified deployment profile
});
```

The standalone factory deploys via Verifiable Factory and certifies the owner. Return an explicit
`already-deployed` result only after verifying the existing account. A newly deployed result includes
address and confirmed transaction receipt under the existing direct-write conventions. A race that
causes simulation/submission to revert must be reconciled before declaring success.

`deployHca.call` represents the factory call for compatible batching. Its planner must handle missing
code as an intentional deployment precondition. A provider can instead include counterfactual setup
when its verified execution path supports it. Do not silently send an additional wallet transaction.

### `prepareHcaCalls`

```ts
const plan = await sdk.hca.prepareHcaCalls({
  hca,
  authorization: { kind: "owner" },
  calls: [
    sdk.records.setText.call({ name: "alice.eth", key: "url", value: "https://alice.example" }),
  ],
});
```

Result includes verified HCA/account context, authorizing owner, chain/profile fingerprint, resolved
ordered calls, required total value, atomicity, and simulation status. An immutable plan identifies
its inputs and chain snapshot. Provider preparation subsequently adds nonce, gas, quote, sponsorship,
and counterfactual simulation details. It must not change destinations or values without reapproval.

Session preparation requires a validated session reference and applies fixed-policy checks. Generic
raw calls are allowed only for explicit owner execution and must remain clearly distinguishable from
semantic ENS intents. Session raw calls require full calldata/policy validation, not a selector-only
allowlist. Reject delegatecall and unsupported account execution modes.

Existing call authorization must use HCA as the inner caller. An owner may own the name while the HCA
has no permission to change it. Registration under the fixed session must retain the wallet owner
as the recipient. HCA-aware reverse calls are selected deliberately; do not globally rewrite sender
semantics for unrelated contracts.

### `executeHcaCalls`, tracking and results

```ts
const submission = await sdk.hca.executeHcaCalls({
  hca,
  authorization: { kind: "owner" },
  execution: adapter, // absent means direct owner wallet execution
  calls,
});

const status = await sdk.hca.getHcaExecutionStatus({ submission, execution: adapter });
const completed = await sdk.hca.waitForHcaExecution({ submission, execution: adapter });
```

This new action returns a submission handle consistently across transaction, UserOperation and intent
paths. It does not change existing ENS action result types or confirmation defaults. The handle
contains chain/account/adapter identity and provider-specific tracking data; it is not always a hash.
A resumed private-provider submission may need a configured adapter with credentials, never credentials
serialized into the handle.

`waitForHcaExecution` uses shared polling and run-option cancellation; an Effect stream can expose
`watchHcaExecution`. A successful bundler transaction containing a reverted UserOperation is an
execution failure. A successful source claim with a failed destination fill is partial progress,
not a completed ENS write. Provider-specific status mapping belongs in the adapter.

`executeHcaCalls` has no `.call` facade: composing an entire execution lifecycle inside another write
plan is not meaningful. Inner semantic writes retain their existing `.call` support.

## 4. Session contract actions

| Action                       | Parameters                                                    | Required caller / result                                 |
| ---------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `enableHcaSession`           | `hca`, `permissionId`, `sessionKey`, `validUntil`, `resolver` | Owner-authorized HCA execution calls validator           |
| `enableHcaSessionWithRefund` | Same plus `refund` limits                                     | Same path; validates ABI ranges and supported token      |
| `isHcaSessionEnabled`        | `hca`, `permissionId`, block options                          | Validator `isPermissionEnabled` boolean                  |
| `revokeHcaSessions`          | `hca`, owner wallet override if needed                        | Direct owner → HCA, all destination sessions invalidated |

```ts
await sdk.hca.enableHcaSessionWithRefund({
  hca,
  permissionId,
  sessionKey: sessionSignerAddress,
  validUntil,
  resolver,
  refund: {
    token,
    maxExchangeRate,
    maxGasOverhead,
    maxAmount,
  },
});

await sdk.hca.revokeHcaSessions({ hca });
```

Map refund fields exactly to `enableSessionWithRefund`'s `address,uint96,uint48,uint96` tail; the
public field names do not change on-chain order or units. Document provider-defined exchange-rate
units after verification; never guess decimals from the token alone.

Enablement `.call` is an HCA-scoped intent: ordinary `sendCalls` must reject it unless prepared under
the account execution context. The resulting validator call must see the HCA as `msg.sender`.
The high-level enable action wraps that intent in an owner execution plan.

Do not offer revocation as an HCA inner `.call`: even an owner-triggered self-call arrives from the
HCA and fails `onlyOwner`. Do not claim owner UserOperations solve this direct-caller restriction.
Return an observed nonce after confirmation or the decoded revocation event; a predicted increment
is not an observed result, and a concurrent revocation may alter it.

There is no destination `getSessionConfig`, session enumeration or dedicated individual-session
revoke in the deployed validator ABI. `isPermissionEnabled=false` alone cannot distinguish unknown,
expired and nonce-revoked sessions. Provider workflow status may combine persisted authorization,
block timestamp, observed nonce and events, but must preserve an unknown reason when evidence is absent.
Do not read undocumented storage slots to fabricate a complete session API.

## 5. Deposits, signing, upgrades and inspection

| Action                                 | Inputs                                               | Contract route                                                                   |
| -------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `getHcaEntryPoint`                     | `hca`                                                | `entryPoint()`                                                                   |
| `getHcaNonce`                          | `hca`, `key` (uint192)                               | `nonce(key)`; provider chooses validated nonce format                            |
| `getHcaDeposit`                        | `hca`                                                | `getDeposit()`                                                                   |
| `addHcaDeposit`                        | `hca`, `amount`                                      | Payable `addDeposit()`                                                           |
| `withdrawHcaDeposit`                   | `hca`, `to`, `amount`                                | Owner executes HCA self-call to `withdrawDepositTo`; it is EntryPoint/self-gated |
| `getHcaSigningDomain`                  | `hca`                                                | `eip712Domain()` with extensions preserved                                       |
| `verifyHcaSignature`                   | `hca`, `hash`, `signature`                           | `isValidSignature`; valid magic value versus rejection, RPC errors stay errors   |
| `getHcaUpgradeEligibility`             | `hca`, target `implementation`                       | Current gate plus target predecessor gate and `canUpgradeFrom`                   |
| `upgradeHca`                           | `hca`, `implementation`, `data`                      | Direct owner calls `upgradeToAndCall`, not HCA self-call                         |
| `getHcaValidators` / `getHcaExecutors` | `hca`, `cursor`, `size`                              | Paginated methods; expose next cursor, validate sentinel semantics               |
| `getHcaHook`                           | `hca`                                                | `getActiveHook()`                                                                |
| `getHcaFallbackHandler`                | `hca`, `selector`                                    | `getFallbackHandlerBySelector`                                                   |
| `getHcaRegistry`                       | `hca`                                                | Module registry from `getRegistry`, not ENS RootRegistry                         |
| `isHcaModuleInstalled`                 | `hca`, `moduleTypeId`, `module`, `additionalContext` | Account introspection only                                                       |
| `supportsHcaExecutionMode`             | `hca`, `mode`                                        | Account's supported execution mode                                               |

Account support for a module type is not permission to install a module. Normal module install and
uninstall revert in this HCA. An upgrade may change behavior; re-verify before subsequent execution.

Fund recovery uses explicit owner calls to selected assets/recipients; ordinary balances remain viem
reads. Existing ENS permission actions should handle registry approvals where their semantics already
fit. Do not introduce broad operator approval automatically for session registration or record writes.

## 6. Governance and complete ABI classification

The `hca/admin` entry point is explicit and privileged:

- `setHcaFactoryImplementationApproval` → factory `setImplementationApproval`.
- `setHcaUpgradeImplementationApproval` → gate `setImplementationApproval`.
- `setTrustedHcaImplementation` → trusted set `approve`.
- `getHcaGovernanceOwner` / `transferHcaGovernanceOwnership` / `renounceHcaGovernanceOwnership`
  → specifically selected factory or gate; never the immutable HCA account owner.
- Trusted-set role reads/grants/revocations reuse existing EAC permission machinery with an explicit
  contract target; add focused wrappers only when existing actions cannot express that safely.

Full coverage means every ABI function has a deliberate classification, not a convenience method:

| ABI surface                                                                 | Treatment                                                                                                              |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Factory deploy/salt/certification/approval/owner                            | Account and admin actions above; `hcaOwners` duplicates certification read                                             |
| Account owner/nonce/implementation/domain/deposit                           | Focused reads and writes above                                                                                         |
| `initializeAccount`                                                         | Factory initialization only; no public standalone initialization action                                                |
| `executeByOwner`                                                            | Owner execution action                                                                                                 |
| `execute`, `executeComposable`, `executeFromExecutor`, `executeUserOp`      | Account/provider codecs and restricted execution paths, not arbitrary wallet methods                                   |
| Account `validateUserOp`                                                    | EntryPoint callback; never user-facing transaction action                                                              |
| `installModule`, `uninstallModule`                                          | Explicitly unsupported in deployed account                                                                             |
| `setRegistry`                                                               | Advanced self-call-only management; defer high-level action until proven useful and compatible                         |
| `emergencyUninstallHook`                                                    | Inherited specialized signature/timelock path; preserve ABI, defer public workflow pending actual installed-hook proof |
| `supportsModule`, `supportsExecutionMode`, `isInitialized`                  | Capability/inspection reads                                                                                            |
| `proxiableUUID`, `canUpgradeFrom`, gate getters                             | Upgrade verification internals; expose aggregate eligibility                                                           |
| `checkERC7739Support`                                                       | Signature capability probing in account/provider integration                                                           |
| Destination validator enable/permission status                              | Session actions above                                                                                                  |
| Validator `validateUserOp`, `verifyExecution`, `isValidSignatureWithSender` | Protocol callbacks; inspect/simulate only in provider integration                                                      |
| Validator `onInstall`, `onUninstall`, `isModuleType`, `isInitialized`       | Module protocol/capability internals; not user lifecycle methods                                                       |
| Validator selector/address constant getters                                 | Profile/policy discovery and verification; do not generate dozens of SDK actions                                       |
| Source funding validator `sessionConfig`                                    | Rhinestone source-session integration; do not confuse with missing destination getter                                  |
| Source funding install/uninstall                                            | Source Nexus owner flow in Rhinestone extension; not destination HCA module management                                 |
| HCA authorizer `STANDALONE_HCA_FACTORY`                                     | Verify HCA-aware consumer wiring                                                                                       |
| Factory/gate ownership and trusted-set EAC                                  | Explicit governance surface above                                                                                      |

## 7. Events, errors and release criteria

Extend existing event decoding/watch APIs with HCA deployment, session enable/refund configuration,
revocation, implementation approval and upgrade events. Event-derived history needs a starting block
and reorg handling; it is not an authoritative current session list by itself.

Reuse core errors for RPC, wallet and contract boundaries. Add domain codes for account/profile/owner
mismatch, unsupported execution path, session-policy rejection, invalid refund bounds and deployment
race failure. Provider errors remain under execution errors; preserve a cause for diagnostics without
serializing signatures, permits or private payloads.

Before each phase completes, verify the corresponding owner/caller semantics, positive and rejected
flows, and exact deployed ABI encoding using the existing devnet/check tooling. Update SDK exports,
package exports, types and user docs together. Keep every unimplemented action in this document marked
proposed; the TODO ownership and exit gates are in the [main research plan](../hca-integration.md#8-phased-todos).

P2 adds `watchHcaExecution` and typed provider submission inference to the existing SDK group.
See the [adapter package](../../packages/hca/README.md) for the shipped lifecycle and persistence API.
