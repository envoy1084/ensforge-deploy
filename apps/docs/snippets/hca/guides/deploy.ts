import { hca, salt } from "./account";
import { owner, publicClient, sdk } from "./client";

const deployment = await sdk.hca.deployHca({ owner: owner.address, salt });
if (deployment.hash) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployment.hash });
  if (receipt.status !== "success") throw new Error("HCA deployment reverted");
}

export const account = await sdk.hca.getHca({ hca });
