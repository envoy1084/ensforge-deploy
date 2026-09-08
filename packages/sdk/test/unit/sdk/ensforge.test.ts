import { Effect, Stream } from "effect";

import { createConfig } from "@ensforge/core";
import { createMemoryWorkflowStorage } from "@ensforge/core/storage";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { createConfig as createWagmiConfig } from "wagmi";

import { Ensforge } from "../../../src/index.js";
import { createEnsforge } from "../../../src/wagmi.js";
import { makeMainnetPublicClient, testTransport } from "../fixtures/clients.js";

const actionNames = {
  workflows: ["getWorkflow", "listWorkflows", "reconcileWorkflowSubmission"],
  batch: [
    "estimateCalls",
    "executeWritePlan",
    "getCallsStatus",
    "getWalletCapabilities",
    "prepareCalls",
    "readBatch",
    "readBatchSettled",
    "resumeCalls",
    "sendCalls",
    "simulateCalls",
  ],
  capabilities: [
    "getNameCapabilities",
    "getOperatorApproval",
    "getRecordPermissions",
    "getRegistryCapabilities",
    "getRegistryRoles",
    "getRequiredAuthorization",
    "getResolverCapabilities",
    "getResolverDelegateApproval",
    "getResolverRoles",
    "getTokenApproval",
    "getWrapperPermissions",
    "getWriteTarget",
    "hasRegistryRoles",
    "hasResolverRoles",
  ],
  dns: [
    "claimDnsName",
    "getDnsClaimStatus",
    "getDnsImportPlan",
    "getDnsRecord",
    "getDnsRecords",
    "getZoneHash",
    "hasDnsRecords",
    "importDnsName",
    "setDnsRecords",
    "setZoneHash",
  ],
  events: ["getEnsEvents", "getNameHistory", "watchEnsEvents"],
  indexer: [
    "getDecodedName",
    "getEvents",
    "getIndexedName",
    "getIndexedRecords",
    "getIndexedResolver",
    "getIndexerStatus",
    "getNameHistory",
    "getNames",
    "getNamesForAddress",
    "getRecordHistory",
    "getRegistrations",
    "getRegistrationsForAddress",
    "getRegistrationHistory",
    "getRegistriesForAddress",
    "getRegistry",
    "getRegistryLabels",
    "getRegistryRoles",
    "getResolvedNamesForAddress",
    "getResolverApprovals",
    "getResolverMetadata",
    "getResolversForAddress",
    "getSubnames",
    "searchNames",
  ],
  migration: [
    "approveMigration",
    "getMigrationEligibility",
    "getMigrationPlan",
    "getMigrationStatus",
    "getMigrationTarget",
    "migrateName",
    "migrateNames",
  ],
  name: [
    "getCanonicalResource",
    "getExpiry",
    "getManager",
    "getNameState",
    "getNameStatus",
    "getOwner",
    "getProtocol",
    "getRegistrant",
    "getRegistry",
    "getTokenId",
    "isAvailable",
    "isMigrated",
    "isRenewable",
    "isReserved",
    "isWrapped",
  ],
  ownership: [
    "getTtl",
    "reclaimName",
    "setManager",
    "setTtl",
    "transferName",
    "transferRegistrant",
  ],
  permissions: [
    "approveName",
    "clearNameApproval",
    "grantRegistryRoles",
    "grantResolverRoles",
    "grantResolverRootRoles",
    "revokeRegistryRoles",
    "revokeResolverRoles",
    "revokeResolverRootRoles",
    "setOperatorApproval",
    "setRecordPermissions",
    "setResolverDelegateApproval",
  ],
  records: [
    "clearAvatar",
    "clearRecords",
    "getAbi",
    "getAddress",
    "getAddresses",
    "getAvatar",
    "getContentHash",
    "getData",
    "getInterface",
    "getName",
    "getPubkey",
    "getRecords",
    "getText",
    "getTexts",
    "setAbi",
    "setAddress",
    "setAddresses",
    "setAlias",
    "setAvatar",
    "setContentHash",
    "setData",
    "setInterface",
    "setName",
    "setPubkey",
    "setRecords",
    "setText",
    "setTexts",
  ],
  registration: [
    "approvePaymentToken",
    "approveRenewalPayment",
    "commitName",
    "completeRegistration",
    "getCommitmentStatus",
    "getRegistrationParameters",
    "getRegistrationPlan",
    "getRegistrationPrice",
    "getRenewalPrice",
    "isPaymentTokenSupported",
    "makeRegistrationCommitment",
    "registerName",
    "registerNames",
    "renewName",
    "renewNames",
  ],
  resolution: [
    "createResolver",
    "getAlias",
    "getOrCreateResolver",
    "getResolver",
    "getResolverVersion",
    "predictResolverAddress",
    "resolve",
    "resolveBatch",
    "resolveWithResolver",
    "setResolver",
    "setResolverAndRecords",
    "upgradeResolver",
  ],
  reverse: [
    "clearPrimaryName",
    "getPrimaryName",
    "setContractPrimaryName",
    "setPrimaryName",
    "setPrimaryNameForAddress",
  ],
  subnames: [
    "createSubname",
    "deleteSubname",
    "setSubnameExpiry",
    "setSubnameManager",
    "setSubnameRecord",
    "setSubnameResolver",
    "transferSubname",
  ],
  hca: [
    "admin",
    "getHcaEntryPoint",
    "getHcaDeposit",
    "getHcaNonce",
    "getHcaSigningDomain",
    "verifyHcaSignature",
    "getHcaValidators",
    "getHcaExecutors",
    "getHcaHook",
    "getHcaFallbackHandler",
    "getHcaRegistry",
    "isHcaModuleInstalled",
    "supportsHcaExecutionMode",
    "addHcaDeposit",
    "withdrawHcaDeposit",
    "getHcaUpgradeEligibility",
    "upgradeHca",
    "isHcaImplementationTrusted",
    "getHcaUpgradeImplementationApproval",

    "startHcaRegistration",
    "getHcaRegistration",
    "resumeHcaRegistration",
    "cancelHcaRegistration",
    "predictHcaAddress",
    "getHca",
    "getHcaOwner",
    "getHcaImplementation",
    "getHcaAccountId",
    "getHcaSessionNonce",
    "getAuthorizedHcaOwner",
    "getHcaImplementationApproval",
    "verifyHca",
    "getHcaCapabilities",
    "deployHca",
    "prepareHcaCalls",
    "executeHcaCalls",
    "getHcaExecutionStatus",
    "waitForHcaExecution",
    "watchHcaExecution",
    "revokeHcaSessions",
    "enableHcaSession",
    "enableHcaSessionWithRefund",
    "isHcaSessionEnabled",
  ],
  wrapping: [
    "extendSubnameExpiry",
    "getFuses",
    "getWrapperExpiry",
    "setChildFuses",
    "setFuses",
    "unwrapName",
    "wrapName",
  ],
} as const;

describe("Ensforge", () => {
  it("creates an immutable SDK with every grouped core action", () => {
    const sdk = new Ensforge({
      network: "mainnet",
      publicClient: makeMainnetPublicClient(),
    });

    expect(sdk.config.network).toBe("mainnet");
    expect(Object.isFrozen(sdk)).toBe(true);

    for (const [group, names] of Object.entries(actionNames)) {
      const namespace = Reflect.get(sdk, group) as Readonly<Record<string, unknown>>;

      expect(Object.keys(namespace)).toEqual(names);
      expect(Object.isFrozen(namespace)).toBe(true);

      for (const [name, action] of Object.entries(namespace)) {
        if (group === "hca" && name === "admin") {
          expect(Object.keys(sdk.hca.admin)).toEqual([
            "setHcaFactoryImplementationApproval",
            "setHcaUpgradeImplementationApproval",
            "setTrustedHcaImplementation",
            "transferHcaGovernanceOwnership",
            "renounceHcaGovernanceOwnership",
            "grantTrustedHcaRoles",
            "revokeTrustedHcaRoles",
            "getHcaGovernanceOwner",
            "getTrustedHcaRoles",
          ]);
          expect(Object.isFrozen(sdk.hca.admin)).toBe(true);
          for (const privileged of Object.values(sdk.hca.admin)) {
            expect(privileged).toBeTypeOf("function");
            expect(Object.isFrozen(privileged)).toBe(true);
          }
          continue;
        }
        expect(action).toBeTypeOf("function");
        expect(Object.isFrozen(action)).toBe(true);
      }
    }

    expect(Object.values(actionNames).flat()).toHaveLength(218);
  });

  it("defaults to isolated memory stores and preserves explicit storage", async () => {
    const parameters = { network: "mainnet" as const, publicClient: makeMainnetPublicClient() };
    const first = new Ensforge(parameters);
    const second = new Ensforge(parameters);
    const record = { id: "example", revision: 0, value: "saved" };
    expect(await first.config.storage?.create({ namespace: "test", record })).toBe(true);
    expect(await second.config.storage?.get({ namespace: "test", id: record.id })).toBeNull();

    const storage = createMemoryWorkflowStorage();
    expect(new Ensforge({ ...parameters, storage }).config.storage).toBe(storage);
    const core = createConfig(parameters);
    const sdk = new Ensforge(core);
    expect(core.storage).toBeUndefined();
    expect(sdk.config.storage).toBeDefined();
    for (const symbol of Object.getOwnPropertySymbols(core)) {
      expect(Reflect.get(sdk.config, symbol)).toBe(Reflect.get(core, symbol));
    }
  });

  it("accepts a Wagmi config", () => {
    const wagmiConfig = createWagmiConfig({
      chains: [mainnet],
      transports: { [mainnet.id]: testTransport },
    });

    const sdk = createEnsforge({ network: "mainnet", wagmiConfig });

    expect(sdk.config.publicClient.chain?.id).toBe(mainnet.id);
  });

  it("preserves Effect, read request, write intent, batch, and stream APIs", () => {
    const sdk = new Ensforge({
      network: "mainnet",
      publicClient: makeMainnetPublicClient(),
    });

    const owner = sdk.name.getOwner.request({ name: "ens.eth" });

    const records = sdk.records.getRecords.request({
      name: "ens.eth",
      records: { avatar: true, texts: ["url"] },
    });

    const batch = sdk.batch.readBatch.effect({ owner, records });

    const write = sdk.records.setText.call({
      name: "ens.eth",
      key: "url",
      value: "https://ens.domains",
    });

    const events = sdk.events.watchEnsEvents.stream({ name: "ens.eth" });

    expect(Effect.isEffect(sdk.name.getOwner.effect({ name: "ens.eth" }))).toBe(true);
    expect(Effect.isEffect(sdk.indexer.getIndexedName.effect({ name: "ens.eth" }))).toBe(true);
    expect(Effect.isEffect(sdk.indexer.getIndexerStatus.effect())).toBe(true);
    expect(Effect.isEffect(batch)).toBe(true);
    expect(write.operation).toBe("setText");
    expect(Stream.isStream(events)).toBe(true);
  });
});
