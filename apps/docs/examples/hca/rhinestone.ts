import { rhinestone } from "@ensforge/hca/rhinestone";
import { isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { advanceRegistration } from "./advance-registration.js";
import { owner, profile, registration, sdk } from "./sepolia.js";

const apiKey = process.env.RHINESTONE_API_KEY;
const privateKey = process.env.HCA_SESSION_PRIVATE_KEY;
if (!apiKey || !privateKey || !isHex(privateKey) || privateKey.length !== 66)
  throw new Error("Set RHINESTONE_API_KEY and a persistent HCA_SESSION_PRIVATE_KEY in .env.hca");

const execution = rhinestone({
  profile,
  chain: sepolia,
  owner,
  sessionSigner: privateKeyToAccount(privateKey),
  sdk: { apiKey },
});
const hca = await sdk.hca.predictHcaAddress({ owner: owner.address });
await sdk.hca.deployHca({ owner: owner.address });
const session = await execution.extensions.sessions.prepare(sdk.config, {
  hca,
  resolver: registration.resolver,
  validUntil: Number(process.env.HCA_SESSION_VALID_UNTIL),
});
const enabledHash = process.env.HCA_SESSION_ENABLE_HASH;
if (!enabledHash) {
  const enabled = await execution.extensions.sessions.enable(sdk.config, session);
  await sdk.config.publicClient.waitForTransactionReceipt({ hash: enabled.hash });
  process.stdout.write(
    `Save HCA_SESSION_ENABLE_HASH=${enabled.hash} in .env.hca, then run again.\n`,
  );
} else {
  if (!isHex(enabledHash) || enabledHash.length !== 66)
    throw new Error("Invalid session enable hash");

  const operation = await advanceRegistration(sdk, {
    ...registration,
    hca,
    execution,
    authorization: {
      kind: "session",
      permissionId: session.parameters.permissionId,
      enableTransactionHash: enabledHash,
    },
    signerReference: "local-example-session",
  });
  process.stdout.write(
    `${JSON.stringify({ id: operation.id, status: operation.progress.status })}\n`,
  );
}
