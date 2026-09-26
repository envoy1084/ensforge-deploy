import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { concatHex, numberToHex, stringToHex } from "viem";

import {
  AuthorizationError,
  setText,
  getAddress,
  getData,
  getDnsRecord,
  getResolverVersion,
  getText,
  getZoneHash,
  setAlias,
  setDnsRecords,
  setRecords,
  setZoneHash,
  simulateCalls,
} from "../../../../src/index.js";
import { getIntegrationDevnet } from "../../setup/devnet.js";

const encodeDnsName = (name: string) =>
  concatHex([
    ...name
      .split(".")
      .map((label) => concatHex([numberToHex(label.length, { size: 1 }), stringToHex(label)])),
    "0x00",
  ]);

const dnsTxtRecord = (name: string, value: string) => {
  const encodedValue = stringToHex(value);
  const rdata = concatHex([numberToHex(encodedValue.length / 2 - 1, { size: 1 }), encodedValue]);

  return concatHex([
    encodeDnsName(name),
    numberToHex(16, { size: 2 }),
    numberToHex(1, { size: 2 }),
    numberToHex(60, { size: 4 }),
    numberToHex(rdata.length / 2 - 1, { size: 2 }),
    rdata,
  ]);
};

describe("extended resolver writes integration", () => {
  it.effect("atomically sets heterogeneous V2 records in declared order", () =>
    Effect.gen(function* () {
      const devnet = getIntegrationDevnet();
      const name = devnet.fixtures.permissions.v2.permissionedResolver.name;

      const result = yield* setRecords.effect(devnet.configs.v2, {
        name,
        records: [
          { type: "text", key: "com.ensforge.phase11", value: "before-clear" },
          { type: "text", key: "com.ensforge.phase11", value: "first" },
          { type: "text", key: "com.ensforge.phase11", value: "last" },
          { type: "address", address: devnet.accounts.owner2 },
          { type: "data", key: "com.ensforge.phase11", value: "0x1234" },
        ],
      });

      const records = yield* Effect.all(
        {
          text: getText.effect(devnet.configs.v2, {
            name,
            key: "com.ensforge.phase11",
          }),
          address: getAddress.effect(devnet.configs.v2, { name }),
          data: getData.effect(devnet.configs.v2, {
            name,
            key: "com.ensforge.phase11",
          }),
          version: getResolverVersion.effect(devnet.configs.v2, { name }),
        },
        { concurrency: "unbounded" },
      );

      assert.strictEqual(result.mode, "resolver");
      assert.isTrue(result.atomic);
      assert.strictEqual(records.text.value, "last");
      assert.strictEqual(records.address.address, devnet.accounts.owner2);
      assert.strictEqual(records.data.value, "0x1234");
      assert.isFalse(records.version.supported);
    }),
  );

  it.effect(
    "falls back to independently simulated calls when native resolver multicall is absent",
    () =>
      Effect.gen(function* () {
        const devnet = getIntegrationDevnet();
        const name = devnet.fixtures.v1.recordWrites.name;

        const result = yield* setRecords.effect(devnet.configs.v1, {
          name,
          aggregation: "wallet",
          mode: "sequential",
          records: [
            { type: "text", key: "com.ensforge.phase11.fallback", value: "fallback" },
            { type: "data", key: "com.ensforge.phase11.fallback", value: "0x11" },
          ],
        });

        const text = yield* getText.effect(devnet.configs.v1, {
          name,
          key: "com.ensforge.phase11.fallback",
        });

        assert.strictEqual(result.status, "completed");
        assert.strictEqual(text.value, "fallback");
      }),
  );

  it.effect("writes DNS records and zone hashes through a supported Public Resolver", () =>
    Effect.gen(function* () {
      const devnet = getIntegrationDevnet();
      const name = devnet.fixtures.v1.recordWrites.name;
      const recordName = `phase11.${name}`;
      const data = dnsTxtRecord(recordName, "ensforge-phase-11");

      const zoneHash =
        "0x4444444444444444444444444444444444444444444444444444444444444444" as const;

      yield* setDnsRecords.effect(devnet.configs.v1, { name, data });
      yield* setZoneHash.effect(devnet.configs.v1, { name, value: zoneHash });

      const [record, zone] = yield* Effect.all(
        [
          getDnsRecord.effect(devnet.configs.v1, { name, recordName, resource: 16 }),
          getZoneHash.effect(devnet.configs.v1, { name }),
        ] as const,
        { concurrency: "unbounded" },
      );

      assert.strictEqual(record.value, data);
      assert.strictEqual(zone.value, zoneHash);
    }),
  );

  it.effect("sets and clears Permissioned Resolver aliases", () =>
    Effect.gen(function* () {
      const devnet = getIntegrationDevnet();
      const name = devnet.fixtures.permissions.v2.permissionedResolver.name;

      const resolver = devnet.fixtures.permissions.v2.permissionedResolver.resolver;
      const target = "linked-record.eth";
      const encodedName = encodeDnsName(target);
      const { permissionedResolverV2Abi } = yield* Effect.promise(
        () => import("@ensforge/contracts/v2"),
      );
      const wallet = devnet.configs.v2.walletClient;
      if (!wallet) return yield* Effect.die(new Error("Missing integration wallet"));
      const hash = yield* Effect.promise(() =>
        wallet.writeContract({
          account: devnet.accounts.owner,
          chain: wallet.chain,
          address: resolver,
          abi: permissionedResolverV2Abi,
          functionName: "setText",
          args: [encodedName, "description", "linked value"],
        }),
      );
      yield* Effect.promise(() =>
        devnet.configs.v2.publicClient.waitForTransactionReceipt({ hash }),
      );
      yield* setAlias.effect(devnet.configs.v2, { name, target });
      const linked = yield* getText.effect(devnet.configs.v2, { name, key: "description" });
      assert.strictEqual(linked.value, "linked value");

      yield* setAlias.effect(devnet.configs.v2, { name, target: null });
      yield* setText.effect(devnet.configs.v2, {
        name,
        key: "description",
        value: "independent value",
      });
      const unlinked = yield* getText.effect(devnet.configs.v2, { name, key: "description" });
      assert.strictEqual(unlinked.value, "independent value");
    }),
  );

  it.effect("rejects alias and DNS profiles on incompatible resolvers", () =>
    Effect.gen(function* () {
      const devnet = getIntegrationDevnet();

      const [alias, dns] = yield* Effect.all(
        [
          simulateCalls
            .effect(devnet.configs.v2, {
              calls: [setAlias.call({ name: devnet.fixtures.v1.recordWrites.name, target: null })],
            })
            .pipe(Effect.flip),
          simulateCalls
            .effect(devnet.configs.v2, {
              calls: [
                setDnsRecords.call({
                  name: devnet.fixtures.permissions.v2.permissionedResolver.name,
                  data: "0x",
                }),
              ],
            })
            .pipe(Effect.flip),
        ] as const,
        { concurrency: "unbounded" },
      );

      assert.instanceOf(alias, AuthorizationError);
      assert.instanceOf(dns, AuthorizationError);
    }),
  );
});
