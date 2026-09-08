#!/usr/bin/env node

import { Effect } from "effect";

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

import { sepoliaHcaDeployment } from "../packages/contracts/dist/deployments.js";
import { verifyHcaDeployment } from "../packages/test-env/dist/index.js";

// Read-only: no signer, wallet, transaction submission or source-chain funding.
const rpcUrl = process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl, { timeout: 15_000 }) });
const result = await Effect.runPromise(verifyHcaDeployment(client, sepoliaHcaDeployment));
process.stdout.write(
  `Sepolia HCA wiring verified at block ${result.blockNumber}; proxy logic ${result.proxyLogic}\n`,
);
