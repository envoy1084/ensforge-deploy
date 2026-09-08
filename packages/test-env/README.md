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

## Pending image update

The image publishing workflow now builds `post-audit-2` commit
`d0c902eeb388c7fbde3f95d9eaf6076eeedff1d7`. Run **Publish devnet image** manually to publish it.
The current runtime image digest, CI image, and local source pin remain on the previously published
revision until the new image is available and verified. After publication, update
`ensContractsV2Commit` and `ensDevnetImageDigest` in `src/devnet/source.ts`, plus `ENSFORGE_TEST_IMAGE`
in `.github/workflows/ci.yml`, together using the workflow's emitted digest.

The upstream Dockerfile compiles source; its local deployment is not necessarily identical to the
Sepolia artifact snapshot at that commit. Verify the new devnet's discovery payload, fixtures, and
contract compatibility before switching the default image. Sepolia compatibility uses the deployed
artifact ABIs and, when needed, a pinned Sepolia fork.

The publishing workflow applies `scripts/devnet-dockerfile.patch` to the pinned checkout before
building. This copies the migration fixture extraction script and archive before the first
`bun install`, whose root postinstall needs them. The patch changes Docker copy order only, not
contract source or dependencies. Apply the same patch when reproducing the workflow with a direct
local Docker build; reassess it whenever the upstream commit changes.

Upstream [DNS deployment change #422](https://github.com/ensdomains/contracts-v2/pull/422)
removed the separate V1 mirror registrar. New devnets register DNS TLDs through
`RootBatchRegistrar` with `DNSTLDResolver`. Discovery requires `RootBatchRegistrar` and uses it
for the DNS fixture registrar. The obsolete mirror field is removed from deployment profiles;
its historical Sepolia artifact ABI remains available. No fixture or test invokes that mirror.

The new image now passes deployment discovery, but fixture seeding still requires migration:
`UserRegistry.initialize` changed from `(address, uint256)` to `Grant[]` in upstream #405.
The existing seed call reverts before integration tests run. Keep the default image unchanged
until source-level ABI and fixture compatibility is verified.

## Development

```sh
pnpm --filter @ensforge/test-env typecheck
pnpm --filter @ensforge/test-env build
pnpm --filter @ensforge/test-env verify
```
