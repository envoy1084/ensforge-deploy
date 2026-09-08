# Pimlico owner execution

`@ensforge/hca/pimlico` implements owner-signed EntryPoint 0.7 UserOperations for the recorded ENS
standalone HCA. It uses `permissionless` 0.4 and Viem, without importing Rhinestone. The existing
`sdk.hca` actions remain the public ENS API.

Install `@ensforge/hca`, `permissionless@^0.4.0`, `viem@^2.56.0`, and the compatible Effect peer.
`permissionless` is optional for consumers using only another provider.

## Configure and execute

```ts
import { pimlico } from "@ensforge/hca/pimlico";
import { sepoliaHcaDeployment } from "@ensforge/contracts/deployments";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { http } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";

const client = createPimlicoClient({
  chain: sepolia,
  transport: http(pimlicoRpcUrl),
  entryPoint: { address: entryPoint07Address, version: "0.7" },
});

const execution = pimlico({
  profile: sepoliaHcaDeployment,
  chain: sepolia,
  client,
  owner: {
    address: ownerAddress,
    signMessage: (parameters) =>
      walletClient.signMessage({
        ...parameters,
        account: ownerAddress,
      }),
  },
  // Omit sponsorship to pay gas from the HCA's ETH balance/EntryPoint deposit.
  sponsorship: { policyId: sponsorshipPolicyId },
});

const submission = await sdk.hca.executeHcaCalls({
  hca,
  authorization: { kind: "owner" },
  calls,
  execution,
});

const outcome = await sdk.hca.waitForHcaExecution({ submission, execution });
```

A Viem local account can be passed directly as `owner`. Contract owners requiring ERC-1271
UserOperation validation are not supported by this deployed HCA validator.

The execution RPC in `sdk` and the bundler must use the same chain. The adapter checks bundler
chain/EntryPoint support and deployed EntryPoint code. The HCA implementation's EntryPoint must
match the supplied profile. No bundler compatibility claim follows solely from those checks.

## Optional sponsorship

Omit `sponsorship` for account-funded gas. Set `sponsorship: {}` to use the Pimlico client's paymaster
with its default policy, or supply `policyId`. A separate paymaster client can be supplied as
`sponsorship.client`; it must expose Viem-compatible `getPaymasterStubData` and `getPaymasterData`.
Use an ETH sponsorship service, not a token-charging paymaster.

A rejection, expired sponsorship, missing paymaster response, or failed simulation aborts the
operation. There is no automatic fallback to account-funded execution. Sponsorship covers gas;
ETH transferred by the calls still comes from the HCA. This adapter does not add token approvals
or support ERC-20 gas payments, Rhinestone refunds, or cross-chain funding.

For account-funded execution, `policy.feeLimits` can cap the total native execution gas cost:

```ts
policy: {
  feeLimits: [{ kind: "execution", chainId: sepolia.id, token: "native", maximum: maximumGasWei }],
}
```

The review reports a conservative maximum gas cost using the final gas limits and maximum gas
price. Sponsored execution reports zero account-paid gas. Call values and ENS registration prices
remain part of the reviewed calls; gas sponsorship does not pay them.

## Deploy with the first operation

```ts
const hca = await sdk.hca.predictHcaAddress({ owner: ownerAddress, salt });

const submission = await sdk.hca.executeHcaCalls({
  hca,
  salt,
  counterfactualOwner: ownerAddress,
  authorization: { kind: "owner" },
  calls,
  execution,
});
```

Core verifies the owner-derived address, approved implementation, and factory deployment wiring.
The UserOperation carries `StandaloneHCAFactory.deploy(owner, implementation, salt)`. Existing
accounts omit factory data. `verifyHca` retains deployed-only behavior by default; its explicit
`allowUndeployed` option requires `expectedOwner`, and returns `deployed: false` when only deployment
inputs are verified. Undeployed session execution and direct-wallet execution are rejected.

Without sponsorship, fund the predicted HCA address or its EntryPoint deposit before estimating.
With sponsorship, fund any value-bearing calls. Semantic ENS `.call` preparers that need existing
account state may require deployment first; raw calls can be used for an initial atomic batch.

Bundler factory validation/staking restrictions still apply. If the deployed ENS factory is rejected
by a hosted bundler, deploy using `sdk.hca.deployHca` first; the adapter never does this silently.

## Review, signing, and recovery

For a separate user review, use `sdk.hca.prepareHcaCalls`, then `execution.prepare(config, plan)`,
`execution.authorize(config, prepared)`, and `execution.submit(config, authorized)`.

The internal account uses nonce key zero, the HCA's fixed owner validator, and atomic ERC-7579 batch
encoding. Factory inputs, nonce, gas limits, fees, and paymaster data are fixed before owner signing.
The exact operation is re-estimated before signing and submission; higher required gas aborts for a
fresh review. Nonce or deployment changes likewise require preparation again.

`reviewLifetimeSeconds` defaults to 300. This expires the local review, **not the on-chain owner
signature**: the deployed validator has no owner UserOperation deadline. Paymasters can impose their
own validity window. Do not treat local expiry as cancellation of an operation already submitted.

Signed operations and signing state remain in memory. Only public tracking fields are persisted:

```ts
const serialized = execution.serializeSubmission(submission);
const restored = execution.restoreSubmission(serialized, {
  chainId: submission.chainId,
  hca: submission.hca,
  profileId: submission.profileId,
  planFingerprint: submission.planFingerprint,
});
```

Persist the expected identity separately in trusted application storage. Recreate the adapter with
the same owner, profile, sponsorship mode, and review lifetime when restoring. RPC URLs, API keys,
policy identifiers, and signatures are not included in the serialized submission.

The prepared payload exposes the deterministic `userOperationHash`. Save it before submission if
you need to reconcile a lost response through `client.getUserOperationReceipt({ hash })`. Submission
is attempted once; an uncertain response does not authorize a retry. Receipt-not-found is `unknown`,
not failure or permission to submit another operation.

Status checks reconcile the bundler receipt with the execution RPC's EntryPoint `UserOperationEvent`,
including sender, hash, and inner success. An outer successful transaction can still contain a failed
HCA operation. Existing SDK wait/watch and persistence APIs work with the Pimlico submission.

## Validation boundary

Local proofs executed real EntryPoint 0.7 `handleOps` calls for deployed and counterfactual HCAs,
owner signatures, local-paymaster sponsorship, inner failure tracking, and submission restoration.
Those proofs used a local transport with fixed gas estimates, so they do not verify ERC-7562
bundler tracing. Hosted Pimlico acceptance, factory validation policy, and real sponsorship require
an API-backed integration run. ENS intent sessions, arbitrary module installation, and direct-owner management
calls such as `revokeSessions` are outside this adapter's execution path.
