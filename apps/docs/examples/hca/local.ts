import assert from "node:assert/strict";

import { createMemoryWorkflowStorage } from "@ensforge/core/storage";
import { createTestConfig } from "@ensforge/core/testing";
import { Ensforge } from "@ensforge/sdk";
import { startEnsDevnet } from "@ensforge/test-env";

await using devnet = await startEnsDevnet();
const config = createTestConfig({
  storage: createMemoryWorkflowStorage(),
  hca: devnet.deployments.hca,
  deployments: devnet.configs.v2.deployments,
  publicClient: devnet.clients.publicClient,
  walletClient: devnet.clients.walletClient,
});
const sdk = new Ensforge(config);
const hca = devnet.fixtures.hca.address;

const submission = await sdk.hca.executeHcaCalls({
  hca,
  authorization: { kind: "owner" },
  calls: [{ to: devnet.accounts.owner, value: 0n }],
});
const status = await sdk.hca.waitForHcaExecution({ submission });
assert.equal(status.status, "succeeded");

const created = await sdk.resolution.createResolver({ salt: 789902n, admin: hca });
assert.ok("resolver" in created);
const resolver = created.resolver;
assert.ok(devnet.deployments.v2.testTokens);
const input = {
  hca,
  name: "hca-docs-example.eth",
  duration: 31_536_000n,
  resolver,
  paymentToken: devnet.deployments.v2.testTokens.usdc,
  authorization: { kind: "owner" as const },
  limits: { registrationPrice: 10n ** 18n, fees: [] },
};
const first = await sdk.hca.startHcaRegistration(input);
const restartedSdk = new Ensforge(config);
const restored = await restartedSdk.hca.startHcaRegistration(input);
assert.equal(restored.id, first.id);
assert.equal(restored.registration.secret, first.registration.secret);
process.stdout.write(
  "Owner execution confirmed; registration ID and secret recovered through config storage.\n",
);
