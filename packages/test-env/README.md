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

Normal local and CI runs pull the pinned immutable image and do not compile contracts. Local image
builds are available only through explicit `build` options for contracts development.

## Sepolia-compatible source pin

The publishing workflow and runtime source pin use
`09bf3ac64a6fb1b215573c019b17e8c501bb3ca0`. Its source matches all 790 source entries
across the five compiler inputs saved under `contracts/deployments/sepolia/build-info`
on `post-audit-2` at `d0c902eeb388c7fbde3f95d9eaf6076eeedff1d7`, including dependencies.
Local testing defaults to
`ghcr.io/envoy1084/ensforge-devnet@sha256:63415642daad6f3486d305b5660a0b9c659203fc20194bafb50b6b1e1bedeef3`.
CI overrides this through `ENSFORGE_TEST_IMAGE` with
`ghcr.io/thenamespace/ensforge-devnet@sha256:0a62a0ee9225c2ed457daca15a9f6fff4db7b8094ed19ca3ad611f35291d2015`.
This verifies source correspondence, not byte-for-byte reproducibility of a fresh image build.

Use the Sepolia artifacts as the integration authority, not the branch tip's Solidity source.
The recorded deployment still uses `UserRegistry.initialize(address,uint256)` and
`PermissionedResolver.initialize(address,uint256,bytes[])`, and still includes
`DNSV1MirrorRootBatchRegistrar`. The newer branch source changes these interfaces and DNS
architecture; compiling that tip does not reproduce the recorded Sepolia deployment.

Both images use the same source commit. When changing either image, verify its ABI compatibility
and pin the corresponding repository and digest. Keep the runtime source pin aligned with the
source used to build both images.

## Development

The CI image may remain private. CI logs in to GHCR with `GITHUB_TOKEN` and `packages: read`.
In the package settings, ensure `thenamespace/ensforge` has at least Read access under
**Manage Actions access**. Local testing uses the `envoy1084` image by default. To use the private
CI image locally, set `ENSFORGE_TEST_IMAGE` and log Docker in with a GitHub personal access token
(classic) that has `read:packages` and access to the package.

```sh
pnpm --filter @ensforge/test-env typecheck
pnpm --filter @ensforge/test-env build
pnpm --filter @ensforge/test-env verify
```

## HCA phase 0

The default seed verifies `deployments.hca` from locally discovered contracts and creates
`fixtures.hca`: a deterministic salt-zero account owned by the fixture owner. Its receipt, certified
owner, proxy implementation, account ID and initial session nonce must agree before the checkpoint.
No Sepolia addresses are used for local factory, resolver, validator or executor discovery.

Wiring verification checks factory approval, the fixed validator/executor, EntryPoint address,
upgrade gates, proxy logic, validator targets/payment tokens and both reverse adapters' factory
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

Set `SEPOLIA_RPC_URL` in the root `.env` to use your RPC; otherwise this uses PublicNode. The command
uses no signer and submits no transactions. It rejects missing Sepolia EntryPoint code, unsupported
chains and mismatched wiring. The result is a block snapshot, not a guarantee of future governance state.

P1 shares the P0 wiring verifier with core and supplies `configs.v2.hca` automatically. This keeps
local SDK actions and fixture setup on the same discovered account profile.
