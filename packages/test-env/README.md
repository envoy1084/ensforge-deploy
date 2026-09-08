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

## Development

```sh
pnpm --filter @ensforge/test-env typecheck
pnpm --filter @ensforge/test-env build
pnpm --filter @ensforge/test-env verify
```
