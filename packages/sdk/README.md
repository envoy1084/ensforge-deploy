# `@ensforge/sdk`

A type-safe client for building ENS applications.

## Features

- Config-bound actions with no repeated client arguments
- Unified behavior across supported ENS deployments
- Grouped APIs for names, records, registration, migration, wrapping, DNS, and reverse records
- Batched reads and wallet-aware write workflows
- Compatible with viem clients and Wagmi configs

## Installation

```sh
pnpm add @ensforge/sdk effect@rc viem
```

## Overview

```ts
import { Ensforge } from "@ensforge/sdk";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const sdk = new Ensforge({
  network: "mainnet",
  publicClient: createPublicClient({ chain: mainnet, transport: http() }),
});

const owner = await sdk.name.getOwner({ name: "ens.eth" });
const avatar = await sdk.records.getAvatar({ name: "ens.eth" });
```

Actions are grouped by ENS capability:

```ts
const duration = 365n * 24n * 60n * 60n;

const state = await sdk.name.getNameState({ name: "ens.eth" });
const resolver = await sdk.resolution.getResolver({ name: "ens.eth" });
const text = await sdk.records.getText({ name: "ens.eth", key: "url" });
const price = await sdk.registration.getRegistrationPrice({ name: "example.eth", duration });
```

Import action-specific types from the corresponding group entrypoint. This keeps editor type
loading focused while method calls remain fully inferred.

```ts
import type { GetOwnerParameters } from "@ensforge/sdk/name";
import type { SetTextParameters } from "@ensforge/sdk/records";
```

Compatible reads can be executed together:

```ts
const profile = await sdk.batch.readBatch({
  owner: sdk.name.getOwner.request({ name: "ens.eth" }),
  avatar: sdk.records.getAvatar.request({ name: "ens.eth" }),
  url: sdk.records.getText.request({ name: "ens.eth", key: "url" }),
});
```

Use an existing Wagmi config instead of supplying viem clients:

```ts
import { createEnsforge } from "@ensforge/sdk/wagmi";

const sdk = createEnsforge({
  network: "mainnet",
  wagmiConfig,
});
```

Add a wallet client—or use a Wagmi config with an active connection—to execute write actions.

## HCA owner execution

Use the same SDK instance and config:

```ts
const deployment = await sdk.hca.deployHca({ owner: walletAddress, salt: 0n });
const submission = await sdk.hca.executeHcaCalls({
  hca: deployment.address,
  authorization: { kind: "owner" },
  calls: [
    sdk.records.setText.call({ name: "alice.eth", key: "url", value: "https://alice.example" }),
  ],
});
await sdk.hca.waitForHcaExecution({ submission });
```

The HCA needs resolver permission before this record update. Without `execution`, the owner wallet
submits an atomic HCA transaction. Supplying an `ExecutionAdapter` selects that adapter's lifecycle,
with no fallback to the wallet. P1 supports owner execution; session/provider integrations follow in
later phases. See the [full action reference](../core/src/actions/hca/README.md).

## License

Apache-2.0

HCA adapters preserve concrete submission payload types through `sdk.hca.executeHcaCalls`.
`sdk.hca.watchHcaExecution` supports callbacks or `.stream`, sharing bounded polling and confirmation
checks with the wait action. See [`@ensforge/hca`](../hca/README.md) for provider contracts and persistence.
