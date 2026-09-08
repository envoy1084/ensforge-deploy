# Independent Rhinestone funding

`rhinestone(options).crossChain` funds a deployed ENS HCA independently of registration. It uses
Rhinestone SDK 1.8.0's EOA Permit2 path with an address recipient and **no destination calls**. It does
not enable an ENS session, deploy a source smart account, register a name, or require that subsequent
HCA execution use Rhinestone. The existing ENSforge SDK patch remains required for HCA verification.

This implementation supports one explicit source chain, one source ERC-20 and one destination ERC-20
per quote. Native wrapping, Compact deposits, swaps, source smart accounts, source sessions and
multi-source routes are rejected. These need independently verified authorization and settlement
implementations before enabling them.

## Configure reviewed routes

```ts
const execution = rhinestone({
  ...destinationOptions,
  crossChain: {
    routes: [reviewedRoute],
    sourceClients: { [sourceChain.id]: sourcePublicClient },
    maximumQuoteLifetimeSeconds: 600,
    confirmations: 2,
  },
});
```

`RhinestoneFundingRoute` identifies the source/destination chain and token addresses, settlement
layer, source arbiter, destination settlement contract, exact qualifier bytes, and pinned contract runtime hashes on both chains.
Include Permit2, the source arbiter, both tokens and every relevant settlement contract in the
manifest. Record the audited artifact/deployment provenance. Runtime hashes do not by themselves
prove proxy implementation slots, upgrade policy or settlement correctness; review those independently.
Never construct this manifest by trusting a quote returned by the orchestrator.

No public source route is enabled by default. ENS Sepolia artifacts establish HCA compatibility;
they do not establish source-chain funding infrastructure. Unsupported or mismatched routes fail
before signing. `capabilities.crossChainFunding` on the common execution adapter and the recorded
HCA generation remains false until hosted route proofs justify a default capability claim.

## Quote, approve, fund

```ts
import { createMemoryHcaStorage } from "@ensforge/hca";

const storage = createMemoryHcaStorage(); // Replace with persistent atomic storage in production.
const quote = await execution.crossChain.quoteFunding(config, {
  id: fundingId,
  routeId: reviewedRoute.id,
  source: {
    chain: sourceChain,
    account: sourceAccount, // Viem Account with signTypedData, including a wallet-backed account.
    publicClient: sourcePublicClient,
  },
  destinationHca: hca,
  amount: destinationAmount,
  maximumSourceSpend: maximumTotalSourceDebit,
  sponsored: false,
});

// Review quote.record.sourceSpend, deadlines, token addresses and approvals in the UI.
for (const approval of quote.approvals) {
  const hash = await sourceWalletClient.sendTransaction({
    account: sourceAccount,
    chain: sourceChain,
    to: approval.to,
    data: approval.data,
    value: approval.value,
  });
  await sourcePublicClient.waitForTransactionReceipt({ hash });
}

await execution.crossChain.fund(config, { quote, storage });
const funding = await execution.crossChain.waitForFunding(config, {
  id: fundingId,
  storage,
  timeoutMs: 120_000,
});

if (funding.status === "funded") {
  await sdk.hca.startHcaRegistration({ ...registration, storage });
}
```

Amounts are integer token units. `maximumSourceSpend` bounds the **entire Permit2 debit**, including
any fees paid from the source token. `sponsored` is a routing request; always review the resulting
source debit, including when sponsorship is requested. Source approval transactions require the
source EOA's native gas. Funding never silently deploys an account or submits unlimited approvals.

When an allowance is insufficient, the quote returns an exact approval and, if needed, a zero reset
first. The caller sends these transactions. Existing larger allowances are not silently overwritten;
the signed permit still caps this operation's debit. The quote is local to its adapter instance and
cannot be deserialized for signing. After a reload, reconcile saved operations before obtaining a
fresh quote with a new ID.

## Status and recovery

All methods are normal Ensforge actions: `(config, parameters)` and `.effect(config, parameters)`.
`waitForFunding` also accepts the usual action run options, including `signal` for aborting the wait.
Timeout returns the most recent status and does not cancel or retry funding.

| Method              | Purpose                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| `quoteFunding`      | Verify recipient, source contracts, route and spending; return approval calls  |
| `fund`              | Claim the durable operation, sign the reviewed Permit2 mandate and submit once |
| `getFundingStatus`  | Read provider tracking and confirm token movements using chain receipts        |
| `waitForFunding`    | Poll with a bounded timeout; stop when destination funds are available         |
| `recoverFunding`    | Attach an intent ID recovered after a lost submission response                 |
| `cancelFunding`     | Atomically cancel local authorization before submission is claimed             |
| `getFundingCleanup` | Prepare source nonce invalidation and allowance-reset calls                    |

Storage uses the shared `HcaStorage` under `rhinestone/funding`. It persists the source/destination
identity, reviewed amounts, Permit2 nonce and typed-data hash, deadlines and optional provider ID.
No signed permit or signer is persisted. The record state progresses through `authorizing`,
`submitting`, `submitted`, or `cancelled`.

A crash during signing may leave `authorizing`: cancel that local record before starting again.
A timeout after the durable `submitting` transition stays uncertain. It is never automatically retried.
Use `recoverFunding(config, { id, storage, intentId })` with the correct ID obtained from the provider.
The SDK status endpoint does not expose the original signed mandate, so matching a recovered ID to
its saved scope hash requires operator/provider evidence; chain/receipt checks alone are not that proof.

`destination` and `claims` are separate. `funded` means a confirmed receipt has a sufficient net ERC-20
credit to the HCA and its current balance is sufficient. Claims show independently confirmed source
ERC-20 debits. The provider supplies receipt locators; these token observations do **not** prove the
settlement protocol's intent identifier or cross-chain finality. Do not use them as bridge accounting
or proof of source claim completion. A source claim may still be pending when the HCA can register.
Provider failure, expiry or a missing receipt never gives permission to resubmit automatically.

`getFundingCleanup` returns two explicit calls for the original source EOA: invalidate this Permit2
nonce, then reset that token's Permit2 allowance to zero. Invalidation can race a claim already in
flight; it cannot reverse destination funds or guarantee cancellation of an accepted intent. Resetting
an allowance affects other outstanding Permit2 operations for that token. Review those operations
before sending cleanup. Local cancellation does not revoke an ENS session or undo an approval.

## Evidence and release boundary

The API shape follows Rhinestone's [custom recipient](https://docs.rhinestone.dev/smart-wallet/chain-abstraction/custom-recipient)
and [EOA](https://docs.rhinestone.dev/smart-wallet/core/eoa) flows; the exact signature behavior is
checked against installed SDK 1.8.0. The Permit2 witness binds recipient, output token/amount,
source debit, spender, chains, nonce, deadlines and empty execution lists.

Local verification exercises real EOA signatures and destination token receipts with a mock source
RPC/orchestrator, plus ordinary registration using the shared store. It does not prove hosted
Rhinestone liquidity, source settlement contracts, bridge finality or production sponsorship. Public
route manifests and hosted source-claim/destination-fill proofs remain release work; no unverified
addresses have been added to the ENS deployment profile.
