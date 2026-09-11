import { Effect, Deferred } from "effect";

import { createPublicClient, createWalletClient, custom, type Hex } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { getWorkflow } from "../../../src/actions/workflows/get-workflow/index.js";
import { listWorkflows } from "../../../src/actions/workflows/list-workflows/index.js";
import { createConfig } from "../../../src/config/create-config.js";
import { WalletError } from "../../../src/errors/wallet-error.js";
import { WorkflowError } from "../../../src/errors/workflow-error.js";
import { acquireWorkflow } from "../../../src/internal/workflows/acquire.js";
import { encodeWorkflowValue, decodeWorkflowValue } from "../../../src/internal/workflows/codec.js";
import { journalSubmission } from "../../../src/internal/workflows/journal.js";
import {
  loadWorkflowRecord,
  storeWorkflowRecord,
  workflowNamespace,
} from "../../../src/internal/workflows/record.js";
import { withWorkflow } from "../../../src/internal/workflows/run.js";
import { createMemoryWorkflowStorage } from "../../../src/workflows/memory.js";
import type { WorkflowStorage } from "../../../src/workflows/storage.js";
import type { WorkflowProgress } from "../../../src/workflows/types.js";

const owner = "0x0000000000000000000000000000000000000001";
const destination = "0x0000000000000000000000000000000000000002";
const hash = `0x${"ab".repeat(32)}` as Hex;
const transport = custom({
  request: async () => {
    throw new Error("Unexpected RPC call");
  },
});
const configFor = (storage?: WorkflowStorage) =>
  createConfig({
    network: "mainnet",
    publicClient: createPublicClient({ chain: mainnet, transport }),
    walletClient: createWalletClient({ chain: mainnet, account: owner, transport }),
    ...(storage ? { storage } : {}),
  });
type Progress = WorkflowProgress & { status: "waiting" | "completed"; count: number };
type Input = { name: string; duration: bigint; workflowId?: string; resume?: Progress };

describe("workflow persistence", () => {
  it("round trips bigint payloads without marker collisions and excludes error credentials", () => {
    const value = { amount: 1n, nested: ["bigint", "12"], marker: { bigint: "42" } };
    expect(decodeWorkflowValue(encodeWorkflowValue(value))).toEqual(value);
    expect(encodeWorkflowValue(new Error("https://rpc.example/SECRET"))).not.toContain("SECRET");
    expect(() => encodeWorkflowValue({ signer: () => hash })).toThrow();
  });

  it("resumes normalized unfinished inputs, respects explicit progress, and starts a new completed instance", async () => {
    const config = configFor(createMemoryWorkflowStorage());
    const action = withWorkflow<Input, Progress>("renewName", (_config, input) =>
      Effect.succeed({
        status: input.resume ? "completed" : "waiting",
        count: (input.resume?.count ?? 0) + 1,
      }),
    );
    const first = await Effect.runPromise(action(config, { name: "ENS.eth", duration: 1n }));
    const second = await Effect.runPromise(
      action(config, { name: "ens.eth", duration: 1n, resume: first }),
    );
    expect(second.status).toBe("completed");
    expect(second.workflowId).toBe(first.workflowId);
    expect(second.count).toBe(2);

    const third = await Effect.runPromise(action(config, { name: "ens.eth", duration: 1n }));
    expect(third.workflowId).not.toBe(first.workflowId);
    expect(third.count).toBe(1);
    const saved = await getWorkflow(config, { workflowId: second.workflowId as string });
    expect(saved.status).toBe("completed");
    expect((await listWorkflows(config, { status: "pending" })).workflows).toHaveLength(1);
  });

  it("rejects stale progress and changed domain inputs before executing", async () => {
    const config = configFor(createMemoryWorkflowStorage());
    const execute = vi.fn((_config, input: Input) =>
      Effect.succeed<Progress>({ status: "waiting", count: (input.resume?.count ?? 0) + 1 }),
    );
    const action = withWorkflow<Input, Progress>("renewName", execute);
    const first = await Effect.runPromise(action(config, { name: "ens.eth", duration: 1n }));
    await Effect.runPromise(action(config, { name: "ens.eth", duration: 1n }));
    await expect(
      Effect.runPromise(action(config, { name: "ens.eth", duration: 1n, resume: first })),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      Effect.runPromise(
        action(config, { name: "other.eth", duration: 1n, workflowId: first.workflowId as string }),
      ),
    ).rejects.toMatchObject({ code: "IDENTITY_MISMATCH" });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("allows only one concurrent caller to advance a matching workflow", async () => {
    const config = configFor(createMemoryWorkflowStorage());
    const started = await Effect.runPromise(Deferred.make<void>());
    const release = await Effect.runPromise(Deferred.make<void>());
    const action = withWorkflow<Input, Progress>("renewName", () =>
      Effect.promise(async () => {
        await Effect.runPromise(Deferred.succeed(started, undefined));
        await Effect.runPromise(Deferred.await(release));
        return { status: "waiting", count: 1 };
      }),
    );
    const pending = Effect.runPromise(action(config, { name: "ens.eth", duration: 1n }));
    await Effect.runPromise(Deferred.await(started));
    await expect(
      Effect.runPromise(action(config, { name: "ens.eth", duration: 1n })),
    ).rejects.toMatchObject({ code: "BUSY" });
    await Effect.runPromise(Deferred.succeed(release, undefined));
    await pending;
  });

  it.each(["transaction", "batch"] as const)(
    "reuses a submitted %s reference and blocks changed calls or routes",
    async (initialKind) => {
      let kind = initialKind;
      const config = configFor(createMemoryWorkflowStorage());
      let data = "0x12" as Hex;
      let fail = true;
      const send = vi.fn(() => Effect.succeed(hash));
      const action = withWorkflow<Input, Progress>("renewName", () =>
        Effect.gen(function* () {
          yield* journalSubmission(
            kind,
            [
              {
                id: "renew",
                operation: "renew",
                chainId: 1,
                account: owner,
                to: destination,
                value: 1n,
                data,
              },
            ],
            send,
            (value) => value,
            (value) => value as Hex,
          );
          if (fail)
            return yield* new WorkflowError({
              code: "INVALID_STATE",
              message: "Interrupted after submission",
            });
          return { status: "completed", count: 1 };
        }),
      );
      await expect(
        Effect.runPromise(action(config, { name: "ens.eth", duration: 1n })),
      ).rejects.toThrow("Interrupted");
      kind = initialKind === "batch" ? "transaction" : "batch";
      await expect(
        Effect.runPromise(action(config, { name: "ens.eth", duration: 1n })),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      kind = initialKind;
      data = "0x34";
      await expect(
        Effect.runPromise(action(config, { name: "ens.eth", duration: 1n })),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      data = "0x12";
      fail = false;
      await Effect.runPromise(action(config, { name: "ens.eth", duration: 1n }));
      expect(send).toHaveBeenCalledTimes(1);
    },
  );

  it("retains an uncertain submission when its returned hash cannot be persisted", async () => {
    const backend = createMemoryWorkflowStorage();
    let failOnce = true;
    const storage: WorkflowStorage = {
      ...backend,
      async compareAndSwap(input) {
        if (failOnce && input.record.value.includes(hash)) {
          failOnce = false;
          throw new Error("Storage offline");
        }
        return backend.compareAndSwap(input);
      },
    };
    const config = configFor(storage);
    const send = vi.fn(() => Effect.succeed(hash));
    const action = withWorkflow<Input, Progress>("renewName", () =>
      Effect.gen(function* () {
        yield* journalSubmission(
          "transaction",
          [
            {
              id: "renew",
              operation: "renew",
              chainId: 1,
              account: owner,
              to: destination,
              value: 1n,
              data: "0x12",
            },
          ],
          send,
          (value) => value,
          (value) => value as Hex,
        );
        return { status: "completed", count: 1 };
      }),
    );
    await expect(
      Effect.runPromise(action(config, { name: "ens.eth", duration: 1n })),
    ).rejects.toMatchObject({ code: "SUBMISSION_UNCERTAIN" });
    await expect(
      Effect.runPromise(action(config, { name: "ens.eth", duration: 1n })),
    ).rejects.toMatchObject({ code: "SUBMISSION_UNCERTAIN" });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("lets a definitively rejected wallet request be retried", async () => {
    const config = configFor(createMemoryWorkflowStorage());
    let reject = true;
    const action = withWorkflow<Input, Progress>("renewName", () =>
      Effect.gen(function* () {
        yield* journalSubmission(
          "transaction",
          [
            {
              id: "renew",
              operation: "renew",
              chainId: 1,
              account: owner,
              to: destination,
              value: 1n,
              data: "0x12",
            },
          ],
          () =>
            reject
              ? Effect.fail(
                  new WalletError({ code: "USER_REJECTED", message: "Rejected", cause: null }),
                )
              : Effect.succeed(hash),
          (value) => value,
          (value) => value as Hex,
        );
        return { status: "completed", count: 1 };
      }),
    );
    await expect(
      Effect.runPromise(action(config, { name: "ens.eth", duration: 1n })),
    ).rejects.toMatchObject({ code: "USER_REJECTED" });
    reject = false;
    expect(
      (await Effect.runPromise(action(config, { name: "ens.eth", duration: 1n }))).status,
    ).toBe("completed");
  });

  it("fences expired workers without letting their cleanup release the new worker", async () => {
    const storage = createMemoryWorkflowStorage();
    const input = { fingerprint: "lease-test", operation: "renewName", chainId: 1, account: owner };
    const previous = await acquireWorkflow(storage, input);
    await storage.compareAndSwap({
      namespace: workflowNamespace,
      id: previous.record.id,
      expectedRevision: previous.record.revision,
      record: storeWorkflowRecord({
        ...previous.record,
        revision: previous.record.revision + 1,
        leaseUntil: 0,
      }),
    });
    const current = await acquireWorkflow(storage, input);
    await expect(previous.update((record) => record)).rejects.toMatchObject({ code: "CONFLICT" });
    await previous.release();
    expect((await loadWorkflowRecord(storage, current.record.id))?.owner).toBe(
      current.record.owner,
    );
    await current.release();
    expect((await loadWorkflowRecord(storage, current.record.id))?.owner).toBeNull();
  });

  it("preserves explicit resume without requiring storage", async () => {
    const action = withWorkflow<Input, Progress>("renewName", (_config, input) =>
      Effect.succeed(input.resume ?? { status: "waiting", count: 0 }),
    );
    const progress: Progress = { status: "waiting", count: 5 };
    expect(
      await Effect.runPromise(
        action(configFor(), { name: "ens.eth", duration: 1n, resume: progress }),
      ),
    ).toEqual(progress);
  });
});
