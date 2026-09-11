import type {
  RhinestoneExecutionAdapter,
  QuoteRhinestoneFundingParameters,
} from "@ensforge/hca/rhinestone";
import type { Ensforge } from "@ensforge/sdk";
import type { WalletClient } from "viem";

/** The adapter must contain an independently verified source/destination route manifest. */
export const fundHca = async (
  sdk: Ensforge,
  execution: RhinestoneExecutionAdapter,
  sourceWallet: WalletClient,
  input: QuoteRhinestoneFundingParameters,
) => {
  if (
    !sourceWallet.account ||
    sourceWallet.account.address.toLowerCase() !== input.source.account.address.toLowerCase()
  )
    throw new Error("Source wallet must match the quoted funding account");
  if ((await sourceWallet.getChainId()) !== input.source.chain.id)
    throw new Error("Source wallet is on the wrong chain");

  const quote = await execution.crossChain.quoteFunding(sdk.config, input);
  // Approvals are ordered deliberately, including any zero-reset required by the token.
  for (const call of quote.approvals) {
    // oxlint-disable-next-line no-await-in-loop
    const hash = await sourceWallet.sendTransaction({
      ...call,
      account: sourceWallet.account,
      chain: input.source.chain,
    });
    // oxlint-disable-next-line no-await-in-loop
    const receipt = await input.source.publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("Funding approval reverted");
  }

  const funding = await execution.crossChain.fund(sdk.config, { quote });
  return execution.crossChain.waitForFunding(sdk.config, { id: funding.id });
};
