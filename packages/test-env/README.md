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
