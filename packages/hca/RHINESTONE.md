# Rhinestone destination sessions

`@ensforge/hca/rhinestone` implements destination-session execution. ENS actions stay in core and on `sdk.hca`.
It uses Rhinestone's SDK for account derivation, permission IDs, intent preparation, signature
encoding, submission and status. There is no second ENS client.

## Installation

Install `@ensforge/hca` and the optional peer `@rhinestone/sdk@1.8.0`. Apply the shipped patch in the
consuming project; stock 1.8.0 does not support the recorded standalone HCA correctly.

```sh
pnpm add @ensforge/hca @rhinestone/sdk@1.8.0
mkdir -p patches
cp node_modules/@ensforge/hca/patches/rhinestone-sdk-1.8.0.patch patches/
```

Add this to the consuming project's `pnpm-workspace.yaml`, then run `pnpm install`:

```yaml
patchedDependencies:
  "@rhinestone/sdk@1.8.0": patches/rhinestone-sdk-1.8.0.patch
```

The ENSforge workspace already has this configuration. The patch includes the pinned ENS changes
and a small executor-address extension; see its [provenance](patches/README.md). The root and Pimlico
subpaths do not load Rhinestone. Its optional peer is required only when importing `/rhinestone`.

## Create the adapter

```ts
import { rhinestone } from "@ensforge/hca/rhinestone";
import { walletClientToAccount } from "@rhinestone/sdk";
import { sepoliaHcaDeployment } from "@ensforge/contracts/deployments";
import { sepolia } from "viem/chains";

const execution = rhinestone({
  profile: sepoliaHcaDeployment,
  chain: sepolia,
  owner: walletClientToAccount(ownerWalletClient),
  sessionSigner, // Caller-owned Viem Account; retain its key securely for reuse.
  sdk: {
    auth: { mode: "apiKey", apiKey: rhinestoneApiKey },
    provider: { type: "custom", urls: { [sepolia.id]: rpcUrl } },
  },
  sponsored: true,
  policy: {
    requireExpiry: true,
    feeLimits: [{ kind: "execution", chainId: sepolia.id, token: "native", maximum: 0n }],
  },
});
```

The adapter verifies the existing HCA, immutable owner, initial implementation, factory, validator
and executor against the configured deployment before use. Derivation must agree with core. A
nonzero HCA salt must be supplied to session preparation and execution. `sessionSalt` is a separate,
optional bytes32 SDK salt used to distinguish session permission IDs.

The adapter accepts deployed, prefunded destination accounts only. Deploy with `sdk.hca.deployHca`, create
or predict a compatible Permissioned Resolver, and fund the HCA separately. The core fixed policy
permits an exact resolver deployment as the first call of an execution batch.

## Enable and execute

```ts
const session = await execution.extensions.sessions.prepare(config, {
  hca,
  resolver,
  validUntil: Math.floor(Date.now() / 1000) + 3600,
});

// Uses config's connected immutable-owner wallet and sends an ordinary HCA owner transaction.
const enabled = await execution.extensions.sessions.enable(config, session);
await sdk.hca.waitForHcaExecution({ submission: enabled });

const authorization = {
  kind: "session" as const,
  permissionId: session.parameters.permissionId,
  enableTransactionHash: enabled.hash,
};

const plan = await sdk.hca.prepareHcaCalls({
  hca,
  authorization,
  calls: [
    sdk.records.setText.call({ name: "alice.eth", key: "url", value: "https://alice.example" }),
  ],
});
const prepared = await execution.prepare(config, plan);
// Present prepared.review: signer, typed-data scope, expiry and separate fee bounds.
const authorized = await execution.authorize(config, prepared);
const submission = await execution.submit(config, authorized);
await sdk.hca.waitForHcaExecution({ submission, execution });
```

For an application that already supplies its approval UI, `sdk.hca.executeHcaCalls({ hca,
authorization, calls, execution })` runs the same lifecycle. Omitting `execution` only supports owner
authorization; session requests never fall back to an owner transaction.

The destination validator enables sessions through HCA owner calls. Rhinestone's generic
`experimental_getSessionDetails` / `experimental_signEnableSession` flow targets Smart Session
Emissary and is not needed for this already-enabled destination path. This integration therefore uses SDK
permission IDs and execution signatures with core on-chain enablement. Atomic first-use owner
proofs and source-account authorization remain future workflow/funding work.

The equivalent core methods are `enableHcaSession`, `enableHcaSessionWithRefund`, and
`isHcaSessionEnabled` (also `.request` for batching). Enable actions return transaction submission
handles and expose `.call` intents restricted to their own HCA's execution context. `revokeHcaSessions`
must be called directly by the owner and invalidates every destination session by advancing its nonce.

## Policy and reconciliation

A session reference includes its confirmed enablement transaction. Core derives its signer, resolver,
expiry, nonce and refund limits from canonical validator events. It checks subsequent enablement logs
and current on-chain status, rejecting expired, revoked or replaced references. RPCs must support
receipts and logs from that enablement block onward; an RPC range error fails preparation rather than
silently accepting stale settings. Re-enable to obtain a fresh reference when needed.

Core decodes complete calldata, including nested multicalls. It checks zero native value, supported
record setters, registrar commit/register, the immutable registration recipient, the bound resolver,
exact resolver initialization/deployment ordering, required owner root-role grants, reverse records
and constrained token approvals. It rejects arbitrary targets, transfers, management and upgrades.
Resolver recursion is limited to 32 levels during preparation.

The adapter accepts one same-chain `NO_FUNDING`/`INTENT_EXECUTOR` operation. It rejects changed calls,
extra source calls, swaps, token movements and different origin/target nonces. The latter matters
because the SDK signs both envelopes; a prefunded route must not authorize two separately replayable
operations or refund claims. A provider route that does not meet these constraints is unsupported
and fails before signing.

Before signing, the exact atomic owner batch is simulated and fixed session/refund policy is
checked. After SDK signing, the HCA's actual ERC-1271 entry point must accept the signature; this is
repeated before submission. Account/session state, batch simulation and reviewed fee bounds are rechecked at lifecycle boundaries. This
proves signature/policy acceptance, not the availability or settlement behavior of a hosted relayer.

Only public intent tracking data can be serialized. Credentials, SDK signing objects, session keys
and signed operations remain outside the tracking codec. Abandoned in-memory operations expire;
restarted applications restore submissions for status, and prepare new operations before signing.
Uncertain submissions must be reconciled; they are never automatically retried.

## Bounded executor refunds

Use `sponsored: false` and prepare a session with:

```ts
refund: {
  token: paymentToken,
  maxExchangeRate,
  maxGasOverhead,
  maxAmount,
}
```

The token must be one of the profile's two payment tokens. Rate/amount are uint96 values, overhead
is uint48. These are the deployed contract's raw refund units; do not substitute decimal token
prices. The actual provider quote must fit every bound. Include an exact payment-token approval to
the profile's gas-refund paymaster for the quote's refund cap. The adapter rejects a mismatched
approval, insufficient prefunding, or any refund in a sponsored route.

Execution fees conservatively show the full signed refund cap as both expected and maximum. Registrar
prices are quoted separately. Registration maximums conservatively include existing registrar
allowance plus approvals in the batch, which can be much larger than the current price. Configure
`policy.feeLimits` for both kinds; registration sponsorship is not implied by execution sponsorship.

## Validation boundary

Local proofs use the pinned devnet contracts, actual patched SDK signatures and a mock relayer that
submits to the local signature-checking executor. Anvil's chain is added to the SDK registry only in
the temporary proof harness. No hosted Rhinestone credentials are used. Hosted Sepolia routing,
relayer settlement and real gas reimbursement still require a credentialed smoke test before release.
Pimlico owner UserOperations, registration orchestration, source funding and cross-chain execution
remain planned integrations.
