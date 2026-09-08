import {
  executeHcaCalls,
  getHcaSessionNonce,
  revokeHcaSessions,
  verifyHca,
  waitForHcaExecution,
} from "@ensforge/core/hca";

import { startEnsDevnet } from "./ens-devnet.js";

await using devnet = await startEnsDevnet();

if (devnet.fixtures.v1.activeUnwrapped.name !== "v1-unwrapped.eth") {
  throw new Error("ENS v1 fixtures were not seeded");
}

if (devnet.fixtures.v2.active.name !== "v2-active.eth") {
  throw new Error("ENS v2 fixtures were not seeded");
}

if (devnet.fixtures.migration.migratedLocked.name !== "v2-migrated-locked.eth") {
  throw new Error("ENS migration fixtures were not seeded");
}

const hca = devnet.fixtures.hca.address;
await verifyHca(devnet.configs.v2, { hca, expectedOwner: devnet.accounts.owner });
const submission = await executeHcaCalls(devnet.configs.v2, {
  hca,
  authorization: { kind: "owner" },
  calls: [{ to: devnet.accounts.owner }],
});
const execution = await waitForHcaExecution(devnet.configs.v2, { submission });
if (execution.status !== "succeeded") throw new Error("HCA owner execution did not succeed");
const revocation = await revokeHcaSessions(devnet.configs.v2, { hca });
if (revocation.sessionNonce !== 1n) throw new Error("HCA sessions were not revoked");

await devnet.reset();
if ((await getHcaSessionNonce(devnet.configs.v2, { hca })) !== 0n) {
  throw new Error("HCA checkpoint was not restored");
}

process.stdout.write(
  `HCA fixture ${devnet.fixtures.hca.address}; EntryPoint deployed: ${devnet.fixtures.hca.wiring.entryPointDeployed}\n`,
);

process.stdout.write(`ENS devnet verified at ${devnet.rpcUrl}\n`);
