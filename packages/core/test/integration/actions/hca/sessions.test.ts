import { ethRegistrarV2Abi, standaloneHcaV2SignatureAbi } from "@ensforge/contracts/v2";
import { hcaOwnerAndSessionValidatorV2Abi } from "@ensforge/contracts/v2/experimental/hca";
import { concatHex, encodeFunctionData, encodePacked, hashTypedData, zeroAddress } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";

import {
  enableHcaSession,
  isHcaSessionEnabled,
  revokeHcaSessions,
} from "../../../../src/actions/hca/index.js";
import { hcaSessionAuthorizationData } from "../../../../src/internal/hca/session-authorization.js";
import { createTestConfig } from "../../../../src/testing/index.js";
import { getIntegrationDevnet } from "../../setup/devnet.js";

describe("stateless HCA sessions", () => {
  it("validates a reusable owner proof on the deployed validator and rejects tampering and revocation", async () => {
    const devnet = getIntegrationDevnet();
    const walletClient = devnet.configs.v2.walletClient;
    if (!walletClient) throw new Error("Missing integration wallet");
    const config = createTestConfig({
      deployments: devnet.configs.v2.deployments,
      publicClient: devnet.configs.v2.publicClient,
      walletClient,
      hca: devnet.deployments.hca,
    });
    const hca = devnet.fixtures.hca.address;
    const signer = privateKeyToAccount(generatePrivateKey());
    const block = await config.publicClient.getBlock();
    const session = await enableHcaSession(config, {
      hca,
      sessionKey: signer.address,
      resolver: devnet.fixtures.permissions.v2.permissionedResolver.resolver,
      validUntil: Number(block.timestamp) + 3600,
    });
    const proof = hcaSessionAuthorizationData(hca, config.chainId, session);
    expect(await isHcaSessionEnabled(config, { hca, permissionId: session.permissionId })).toBe(
      false,
    );

    const call = {
      to: devnet.deployments.v2.contracts.ethRegistrar,
      value: 0n,
      data: encodeFunctionData({
        abi: ethRegistrarV2Abi,
        functionName: "commit",
        args: [`0x${"12".repeat(32)}`],
      }),
    };
    const mode = `0x0201${"00".repeat(30)}` as const;
    const operation = encodePacked(
      ["bytes2", "uint8", "address", "uint24", "bytes"],
      ["0x0201", 1, call.to, (call.data.length - 2) / 2, call.data],
    );
    const typed = {
      domain: {
        name: "IntentExecutor",
        version: "v0.0.1",
        chainId: config.chainId,
        verifyingContract: devnet.deployments.hca.infrastructure.intentExecutor,
      },
      primaryType: "SingleChainOps",
      types: {
        SingleChainOps: [
          { name: "account", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "op", type: "Op" },
          { name: "gasRefund", type: "GasRefund" },
        ],
        Op: [
          { name: "vt", type: "bytes32" },
          { name: "ops", type: "Ops[]" },
        ],
        Ops: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
        GasRefund: [
          { name: "token", type: "address" },
          { name: "exchangeRate", type: "uint256" },
          { name: "overhead", type: "uint256" },
        ],
      },
      message: {
        account: hca,
        nonce: 1n,
        op: { vt: mode, ops: [call] },
        gasRefund: { token: zeroAddress, exchangeRate: 0n, overhead: 0n },
      },
    } as const;
    const digest = hashTypedData(typed);
    const signature = concatHex([
      zeroAddress,
      encodePacked(
        [
          "bytes1",
          "bytes32",
          "address",
          "uint48",
          "uint96",
          "address",
          "address",
          "uint96",
          "uint48",
          "uint96",
          "uint8",
          "uint8",
          "uint64",
          "bytes32",
          "bytes",
          "uint256",
          "address",
          "uint96",
          "uint96",
          "uint48",
          "bytes",
          "bytes",
        ],
        [
          "0x05",
          session.permissionId,
          signer.address,
          session.validUntil,
          session.sessionNonce,
          session.resolver,
          session.refund.token,
          session.refund.maxExchangeRate,
          Number(session.refund.maxGasOverhead),
          session.refund.maxAmount,
          0,
          1,
          BigInt(config.chainId),
          proof.sessionDigest,
          session.ownerSignature,
          1n,
          zeroAddress,
          0n,
          0n,
          0,
          operation,
          await signer.signTypedData(typed),
        ],
      ),
    ]);
    const verify = (envelope: typeof signature) =>
      config.publicClient.readContract({
        address: hca,
        account: devnet.deployments.hca.infrastructure.intentExecutor,
        abi: standaloneHcaV2SignatureAbi,
        functionName: "isValidSignature",
        args: [digest, envelope],
      });

    expect(
      await config.publicClient.readContract({
        address: devnet.deployments.hca.contracts.ownerAndSessionValidator,
        account: hca,
        abi: hcaOwnerAndSessionValidatorV2Abi,
        functionName: "isValidSignatureWithSender",
        args: [
          devnet.deployments.hca.infrastructure.intentExecutor,
          digest,
          `0x${signature.slice(42)}`,
        ],
      }),
    ).toBe("0x1626ba7e");
    expect(await verify(signature)).toBe("0x1626ba7e");
    expect(await verify(signature)).toBe("0x1626ba7e");
    // Alter r, not v: recovery values 0/1 and 27/28 can represent the same signature.
    const changedByte = (Number.parseInt(signature.slice(-130, -128), 16) ^ 1)
      .toString(16)
      .padStart(2, "0");
    const altered = `0x${signature.slice(2, -130)}${changedByte}${signature.slice(-128)}` as const;
    expect(await verify(altered)).not.toBe("0x1626ba7e");
    await revokeHcaSessions(config, { hca });
    expect(await verify(signature)).not.toBe("0x1626ba7e");
  });
});
