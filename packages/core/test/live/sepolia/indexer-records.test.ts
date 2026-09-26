import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { getIndexedRecords, getRecordHistory } from "../../../src/actions/indexer/records/index.js";
import { sepoliaConfig, sepoliaNames } from "../setup/sepolia.js";

describe("Sepolia indexed records", () => {
  it.effect("reads a V1 resolver inventory", () =>
    Effect.gen(function* () {
      const inventory = yield* getIndexedRecords.effect(sepoliaConfig, {
        name: sepoliaNames.v1.reserved,
      });

      assert.isTrue(inventory.bindings.some(({ source }) => source.protocol === "v1"));
    }),
  );

  // Re-enable when the V2 indexer joins record-ID updates to name-based event history.
  it.effect.skip("reads V2 inventory and typed record history", () =>
    Effect.gen(function* () {
      const inventory = yield* getIndexedRecords.effect(sepoliaConfig, {
        name: sepoliaNames.v2.profile,
      });

      const current = inventory.bindings.find(
        ({ current: isCurrent, source }) => isCurrent && source.protocol === "v2",
      );

      assert.isDefined(current);
      assert.include(current?.records.coinTypes ?? [], 60n);

      const history = yield* getRecordHistory.effect(sepoliaConfig, {
        name: sepoliaNames.v2.profile,
        filter: { kinds: ["address"] },
      });

      assert.isAbove(history.items.length, 0);
      assert.isTrue(history.items.every(({ kind }) => kind === "address"));
      assert.isTrue(
        history.items.some(({ raw, source }) => source.protocol === "v2" && raw.data !== null),
      );
    }),
  );
});
