/* oxlint-disable no-await-in-loop -- Token approvals must be confirmed in order. */
import type { RhinestoneFundingRoute } from "@ensforge/hca/rhinestone";
import { baseSepolia } from "viem/chains";

import { hca, salt } from "./account";
import { owner, sdk } from "./client";
import { createFundingAdapter, sourceClient, sourceWallet } from "./funding-client";

export async function fundHca(route: RhinestoneFundingRoute, id: string) {
  const execution = createFundingAdapter(route);
  const quote = await execution.crossChain.quoteFunding(sdk.config, {
    id,
    routeId: route.id,
    source: { chain: baseSepolia, account: owner, publicClient: sourceClient },
    destinationHca: hca,
    salt,
    amount: 1_000_000n,
    maximumSourceSpend: 2_000_000n,
  });

  // Confirm approvals in order, including any token-required zero reset.
  for (const call of quote.approvals) {
    const hash = await sourceWallet.sendTransaction(call);
    const receipt = await sourceClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("Source approval reverted");
  }

  const funding = await execution.crossChain.fund(sdk.config, { quote });
  return execution.crossChain.waitForFunding(sdk.config, { id: funding.id });
}
