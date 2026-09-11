import { pimlico } from "@ensforge/hca/pimlico";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { http } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";

import { advanceRegistration } from "./advance-registration.js";
import { owner, profile, registration, sdk } from "./sepolia.js";

const bundlerUrl = process.env.PIMLICO_RPC_URL;
if (!bundlerUrl) throw new Error("Set PIMLICO_RPC_URL in .env.hca");

const execution = pimlico({
  profile,
  chain: sepolia,
  owner,
  client: createPimlicoClient({
    chain: sepolia,
    transport: http(bundlerUrl),
    entryPoint: { address: entryPoint07Address, version: "0.7" },
  }),
  ...(process.env.PIMLICO_SPONSORED === "true"
    ? {
        sponsorship: process.env.PIMLICO_POLICY_ID
          ? { policyId: process.env.PIMLICO_POLICY_ID }
          : {},
      }
    : {}),
});
const hca = await sdk.hca.predictHcaAddress({ owner: owner.address });
await sdk.hca.deployHca({ owner: owner.address });

const operation = await advanceRegistration(sdk, {
  ...registration,
  hca,
  execution,
  authorization: { kind: "owner" },
});
process.stdout.write(
  `${JSON.stringify({ id: operation.id, status: operation.progress.status })}\n`,
);
// Re-run with unchanged inputs to resume saved work; do not delete the database after a timeout.
