# `@ensforge/contracts`

Type-safe contract definitions and deployment metadata for ENS.

## Features

- Versioned ENS contract ABIs organized by protocol
- Function-focused ABI fragments for tree-shakable reads and writes
- Mainnet and Sepolia deployment addresses with provenance
- Reusable resolver profile ABIs
- Shared interfaces, events, errors, and standards
- Immutable TypeScript exports designed for viem

## Installation

```sh
pnpm add @ensforge/contracts
```

## Overview

```ts
import { mainnetV1Deployment, sepoliaV2Deployment } from "@ensforge/contracts/deployments";
import { textResolverAbi } from "@ensforge/contracts/resolver-profiles";
import { ensRegistryV1Abi, ensRegistryV1OwnerAbi } from "@ensforge/contracts/v1";
import { ethRegistrarV2Abi } from "@ensforge/contracts/v2";

const registryAddress = mainnetV1Deployment.contracts.registry;
const registrarAddress = sepoliaV2Deployment.contracts.ethRegistrar;
```

Use the ABIs directly with viem:

```ts
import { namehash } from "viem/ens";

const owner = await publicClient.readContract({
  address: mainnetV1Deployment.contracts.registry,
  abi: ensRegistryV1OwnerAbi,
  functionName: "owner",
  args: [namehash("ens.eth")],
});
```

Function fragments include the relevant custom errors so viem can decode contract reverts. Complete
ABIs such as `ensRegistryV1Abi` remain available for advanced use and event processing.

Package entrypoints include `deployments`, `resolver-profiles`, `shared`, `v1`, and `v2`.

## Sepolia V2 snapshot

Sepolia V2 addresses and ABIs follow the
[deployment artifacts](https://github.com/ensdomains/contracts-v2/tree/71a3b7339dbc55ab47667abdfe8303bac4f4c24e/contracts/deployments/sepolia)
at commit `71a3b7339dbc55ab47667abdfe8303bac4f4c24e`. Use the artifacts rather than branch-tip
source. Run `pnpm verify:sepolia-v2` from the repository root to compare addresses and critical
ABIs with this snapshot and check deployed code.

Legacy upgrade-gate, trusted-set and DNS mirror batch registrar ABI exports are retained for
compatibility, but are not contracts in the current deployment profile. The current profile uses
`HCAUpgradeSet`, `RootBatchRegistrar` and `UniversalHelper`.

## HCA deployment profile

`getHcaDeployment(11155111)` and `sepoliaHcaDeployment` from `@ensforge/contracts/deployments`
provide the pinned account generation, contract wiring and constructor-derived infrastructure.
Other public chain IDs throw; local profiles come from test-env discovery. These are deployment
capabilities, not proof of provider compatibility. Cross-chain funding remains disabled and its
separate source manifest list is empty until verified.

Focused HCA factory, account-inspection and validator-wiring fragments live in `src/v2/fragments/`
and are exported from `@ensforge/contracts/v2`. Complete ABIs retain their existing experimental export.

The upgrade set uses role-based access control. Reverse operations use
`StandaloneHCAFactory.authorizedOwnerOf`; the active profile has no trusted-set dependency.

## License

Apache-2.0
