# `@ensforge/test-env`

Private integration-test infrastructure for ensforge. It starts a pinned combined ENSv1 and ENSv2
Anvil deployment, seeds deterministic names and resolver records, and isolates tests with snapshots.

## Usage

```ts
import { startEnsDevnet } from "@ensforge/test-env";

await using devnet = await startEnsDevnet();

const config = devnet.configs.v2;
const name = devnet.fixtures.v2.active.name;

await devnet.reset();
```

Local runs default to a devnet built from the pinned ENS contracts snapshot. Build it from the
repository root before the first local integration run:

```sh
pnpm build:devnet
pnpm test:integration
```

## Sepolia-compatible source pin

The runtime and publishing workflow use `07e55a056f5b6a9c90119f501bdd05714e67dddd`, the snapshot
linked by the ENS deployment documentation. Deployment JSON artifacts remain the authority for
Sepolia addresses and ABIs. Local contracts use their own discovered addresses.

The default local image is `ensforge-contracts-devnet:07e55a0`. CI pulls
`ghcr.io/<repository-owner>/ensforge-devnet:<contracts-commit>` and passes it through
`ENSFORGE_TEST_IMAGE`. The tag is derived from `ensContractsV2Commit`, so CI uses the same snapshot
as local builds without compiling contracts on every run.

Run **Publish devnet image** successfully before running CI after changing the contracts pin or
the devnet Dockerfile. CI fails if the image cannot be pulled; it does not fall back to a build.
Private packages must grant the repository Actions read access; CI authenticates with `GITHUB_TOKEN`.

The publish workflow also publishes `v2-07e55a0`. To reuse a published image locally, authenticate
with Docker if needed and set `ENSFORGE_TEST_IMAGE` to the immutable image digest from the workflow
summary. Do not reuse the previous deployment's image.

## Development

```sh
pnpm --filter @ensforge/test-env typecheck
pnpm --filter @ensforge/test-env build
pnpm --filter @ensforge/test-env verify
```

## HCA fixtures

The default seed verifies `deployments.hca` from locally discovered contracts and creates
`fixtures.hca`: a deterministic salt-zero account owned by the fixture owner. Its receipt, certified
owner, proxy implementation, account ID and initial session nonce must agree before the checkpoint.
No Sepolia addresses are used for local factory, resolver, validator or executor discovery.

Wiring verification checks factory approval, the fixed validator/executor, EntryPoint address,
upgrade sets, owner registry, proxy logic and validator targets and both reverse adapters' factory
bindings at one block. The implementation's executable bytecode template and compiler-recorded
validator immutables are checked against the artifact. Solidity's metadata trailer is excluded:
the pinned image and Sepolia differ only in that metadata hash after zeroing immutable words.
`isModuleInstalled` cannot verify the default validator because Nexus excludes it from that list.

`fixtures.hca.wiring.entryPointDeployed` reports whether the configured EntryPoint has code. Local
owner execution does not require EntryPoint deployment; this fixture does not prove UserOperation,
paymaster or production intent execution. The local executor is a mock. Provider and source-chain
funding capabilities remain unverified.

For repeatable read-only Sepolia wiring verification, run from the repository root:

```sh
pnpm verify:hca:sepolia
```

Set `ENSFORGE_SEPOLIA_RPC_URL` in the root `.env` to use your RPC; otherwise this uses PublicNode. The command
uses no signer and submits no transactions. It rejects missing Sepolia EntryPoint code, unsupported
chains and mismatched wiring. The result is a block snapshot, not a guarantee of future governance state.

The environment shares the wiring verifier with core and supplies `configs.v2.hca` automatically. This keeps
local SDK actions and fixture setup on the same discovered account profile.

The Docker build preserves the committed Solidity submodules. Do not run `forge install` during
the image build: this snapshot’s `foundry.lock` pins an older VerifiableFactory without the
address-prediction method used by the HCA factory.
