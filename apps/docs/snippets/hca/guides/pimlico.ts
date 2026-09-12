import { pimlico } from "@ensforge/hca/pimlico";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { http } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";

import { owner, profile } from "./client";

const rpcUrl = process.env.PIMLICO_RPC_URL;
if (!rpcUrl) throw new Error("Set PIMLICO_RPC_URL");

export const pimlicoClient = createPimlicoClient({
  chain: sepolia,
  transport: http(rpcUrl),
  entryPoint: { address: entryPoint07Address, version: "0.7" },
});

export const execution = pimlico({
  profile,
  chain: sepolia,
  owner,
  client: pimlicoClient,
  sponsorship: {},
});
