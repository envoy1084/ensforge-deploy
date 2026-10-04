import { verifiableFactoryV2PredictProxyAddressAbi } from "@ensforge/contracts/v2";
import { standaloneHcaFactoryV2Abi } from "@ensforge/contracts/v2/experimental/hca";
import { createWalletClient, http, parseEventLogs } from "viem";
import { describe, expect, it, vi } from "vitest";

import { deployHca, predictHcaAddress, verifyHca } from "../../../../src/actions/hca/index.js";
import { createTestConfig } from "../../../../src/testing/index.js";
import { getIntegrationDevnet } from "../../setup/devnet.js";

describe("HCA deployment reuse", () => {
  it("matches the factory prediction and reuses accounts after approval is revoked", async () => {
    const devnet = getIntegrationDevnet();
    const profile = devnet.deployments.hca;
    const { publicClient, walletClient } = devnet.configs.v2;
    if (!walletClient || !publicClient.chain)
      throw new Error("Missing integration wallet or chain");
    const config = createTestConfig({
      deployments: devnet.configs.v2.deployments,
      publicClient,
      walletClient,
      hca: profile,
    });
    const factory = {
      address: profile.contracts.standaloneFactory,
      abi: standaloneHcaFactoryV2Abi,
    } as const;
    const implementation = profile.contracts.standaloneImplementation;
    const owner = devnet.accounts.owner;
    const salt = 1001n;
    const predicted = await predictHcaAddress(config, { owner, salt });
    const deploymentSalt = await publicClient.readContract({
      ...factory,
      functionName: "deploymentSalt",
      args: [owner, implementation, salt],
    });
    expect(
      await publicClient.readContract({
        address: profile.deployment.contracts.verifiableFactory,
        abi: verifiableFactoryV2PredictProxyAddressAbi,
        functionName: "predictProxyAddress",
        args: [factory.address, deploymentSalt],
      }),
    ).toBe(predicted);

    expect((await deployHca(config, { owner, salt })).status).toBe("deployed");
    const factoryOwner = await publicClient.readContract({ ...factory, functionName: "owner" });
    const admin = createWalletClient({
      account: factoryOwner,
      chain: publicClient.chain,
      transport: http(devnet.rpcUrl),
    });
    await publicClient.waitForTransactionReceipt({
      hash: await admin.writeContract({
        ...factory,
        functionName: "setImplementationApproval",
        args: [implementation, false],
      }),
    });

    try {
      expect(
        (await verifyHca(config, { hca: predicted, expectedOwner: owner, salt })).address,
      ).toBe(predicted);
      expect((await deployHca(config, { owner, salt })).status).toBe("already-deployed");
      await expect(deployHca(config, { owner, salt: salt + 1n })).rejects.toMatchObject({
        code: "UNSUPPORTED_DEPLOYMENT",
      });
      const hash = await admin.writeContract({
        ...factory,
        functionName: "deploy",
        args: [owner, implementation, salt],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).toBe("success");
      expect(
        parseEventLogs({ abi: factory.abi, eventName: "HCADeployed", logs: receipt.logs }),
      ).toHaveLength(0);
    } finally {
      await publicClient.waitForTransactionReceipt({
        hash: await admin.writeContract({
          ...factory,
          functionName: "setImplementationApproval",
          args: [implementation, true],
        }),
      });
    }
  });

  it("reports reuse when another transaction deploys the account after simulation", async () => {
    const devnet = getIntegrationDevnet();
    const profile = devnet.deployments.hca;
    const { publicClient, walletClient } = devnet.configs.v2;
    if (!walletClient || !publicClient.chain)
      throw new Error("Missing integration wallet or chain");
    const config = createTestConfig({
      deployments: devnet.configs.v2.deployments,
      publicClient,
      walletClient,
      hca: profile,
    });
    const owner = devnet.accounts.owner;
    const salt = 1003n;
    const concurrentWallet = createWalletClient({
      account: owner,
      chain: publicClient.chain,
      transport: http(devnet.rpcUrl),
    });
    const send = walletClient.sendTransaction.bind(walletClient);
    const spy = vi
      .spyOn(walletClient, "sendTransaction")
      .mockImplementationOnce(async (parameters) => {
        await publicClient.waitForTransactionReceipt({
          hash: await concurrentWallet.writeContract({
            address: profile.contracts.standaloneFactory,
            abi: standaloneHcaFactoryV2Abi,
            functionName: "deploy",
            args: [owner, profile.contracts.standaloneImplementation, salt],
          }),
        });
        return send(parameters);
      });

    try {
      const result = await deployHca(config, { owner, salt });
      expect(result.status).toBe("already-deployed");
      expect(result.receipt?.status).toBe("success");
      expect(result.hash).not.toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
});
