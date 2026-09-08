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

Sepolia V2 addresses and the 32 complete deployed-contract ABIs were checked against the
[`post-audit-2` deployment artifacts](https://github.com/ensdomains/contracts-v2/tree/d0c902eeb388c7fbde3f95d9eaf6076eeedff1d7/contracts/deployments/sepolia)
at commit `d0c902eeb388c7fbde3f95d9eaf6076eeedff1d7`. The JSON artifacts define the deployed addresses
and ABIs; compiling source from the same commit can produce newer contracts. The exported HCA
funding validator, authorizer, and interfaces have no standalone deployment JSON in this snapshot
and are not additional verified Sepolia deployments.

## HCA deployment profile

`getHcaDeployment(11155111)` and `sepoliaHcaDeployment` from `@ensforge/contracts/deployments`
provide the pinned account generation, contract wiring and constructor-derived infrastructure.
Other public chain IDs throw; local profiles come from test-env discovery. These are deployment
capabilities, not proof of provider compatibility. Cross-chain funding remains disabled and its
separate source manifest list is empty until verified.

Focused HCA factory, account-inspection and validator-wiring fragments live in `src/v2/fragments/`
and are exported from `@ensforge/contracts/v2`. Complete ABIs retain their existing experimental export.

The recorded `TrustedHCASet` address remains historical metadata. This account generation authorizes
reverse operations through `StandaloneHCAFactory.authorizedOwnerOf`; the local deployment does not
create a trusted set. It is not a required dependency of the active HCA profile.

## License

Apache-2.0
