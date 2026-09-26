import { readFileSync } from "node:fs";

import type { Address } from "viem";
import { createPublicClient, http, type PublicClient } from "viem";
import { sepolia } from "viem/chains";

import { createConfig } from "../../../src/index.js";

const readSepoliaRpcUrl = (): string => {
  const value = process.env.ENSFORGE_SEPOLIA_RPC_URL;

  if (value === undefined || value.length === 0) {
    throw new Error(
      "ENSFORGE_SEPOLIA_RPC_URL is required. Run the suite with `ENSFORGE_SEPOLIA_RPC_URL=https://… pnpm test:live:sepolia`.",
    );
  }

  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("ENSFORGE_SEPOLIA_RPC_URL must use HTTP or HTTPS");
  }

  return value;
};

export const sepoliaRpcUrl = readSepoliaRpcUrl();

export const sepoliaPublicClient: PublicClient = createPublicClient({
  chain: sepolia,
  transport: http(sepoliaRpcUrl, {
    retryCount: 2,
    timeout: 20_000,
  }),
});

export const sepoliaConfig = createConfig({
  network: "sepolia",
  publicClient: sepoliaPublicClient,
  indexer: {
    timeout: 30_000,
    retry: { attempts: 1 },
    ...(process.env.ENSFORGE_SEPOLIA_V1_INDEXER_URL === undefined &&
    process.env.ENSFORGE_SEPOLIA_V2_INDEXER_URL === undefined
      ? {}
      : {
          endpoints: {
            ...(process.env.ENSFORGE_SEPOLIA_V1_INDEXER_URL === undefined
              ? {}
              : { v1: process.env.ENSFORGE_SEPOLIA_V1_INDEXER_URL }),
            ...(process.env.ENSFORGE_SEPOLIA_V2_INDEXER_URL === undefined
              ? {}
              : { v2: process.env.ENSFORGE_SEPOLIA_V2_INDEXER_URL }),
          },
        }),
  },
});

// The setup script is the source of truth for names and expected record values.
export const sepoliaFixtures = JSON.parse(
  readFileSync(
    new URL("../../../../../.ensforge/sepolia-v2-fixtures.json", import.meta.url),
    "utf8",
  ),
) as {
  contractsCommit: string;
  names: { root: string };
  accounts: { owner: Address; operator: Address; secondary: Address };
  records: {
    profile: { texts: { key: string; value: string }[]; data: { key: string; value: string } };
  };
};
if (sepoliaFixtures.contractsCommit !== "71a3b7339dbc55ab47667abdfe8303bac4f4c24e") {
  throw new Error(
    "Refresh Sepolia fixtures with pnpm setup:docs-sepolia before running live checks",
  );
}
const root = sepoliaFixtures.names.root;

const rootLabel = root.slice(0, -4);

export const sepoliaNames = {
  v2: {
    root,
    bareRoot: `${rootLabel}-bare.eth`,
    profile: `profile.${root}`,
    empty: `empty.${root}`,
    inherited: `inherited.${root}`,
    alias: `alias.${root}`,
    dns: `dns.${root}`,
    permissioned: `permissioned.${root}`,
    differentOwner: `different-owner.${root}`,
    branch: `branch.${root}`,
    nested: `nested.branch.${root}`,
    customExpiry: `custom-expiry.${root}`,
    available: `${rootLabel}-available.eth`,
    indexedRegistration: root,
    indexedRegistry: root,
  },
  v1: {
    reserved: "vitalik.eth",
    resolverProfile: "resolver.eth",
    wrapped: "wrapped.eth",
  },
  migrated: "raffy.eth",
} as const;

export const sepoliaFixtureAccounts = sepoliaFixtures.accounts;

export const missingSepoliaName =
  `${rootLabel}-missing-${Date.now().toString(36)}-${process.pid.toString(36)}.eth` as const;
