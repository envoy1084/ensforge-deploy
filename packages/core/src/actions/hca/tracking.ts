import { Clock, Effect, Option, Schema, Stream } from "effect";

import { defineAction } from "../../action/action.js";
import type { EnsforgeConfig } from "../../config/config.js";
import { HcaError } from "../../errors/hca-error.js";
import { hcaRpc } from "../../internal/hca/context.js";
import type { WriteError } from "../../write/types.js";
import { getHcaExecutionStatus } from "./status.js";
import type { HcaExecutionStatus, WaitForHcaExecutionParameters } from "./types.js";

const positive = Schema.Number.check(Schema.isFinite(), Schema.isGreaterThan(0));

const waitOptions = (config: EnsforgeConfig, parameters: WaitForHcaExecutionParameters) => {
  const policy = config.writes.confirmation;

  const timeout =
    parameters.timeout ?? (policy.type === "confirmed" ? policy.timeout : undefined) ?? 120_000;

  const confirmations =
    parameters.confirmations ??
    (policy.type === "confirmed" ? policy.confirmations : undefined) ??
    1;

  const pollingInterval = parameters.pollingInterval ?? 1_000;
  const maxPollingInterval = parameters.maxPollingInterval ?? Math.max(pollingInterval, 10_000);

  if (
    ![timeout, confirmations, pollingInterval, maxPollingInterval].every(Schema.is(positive)) ||
    !Number.isInteger(confirmations) ||
    maxPollingInterval < pollingInterval
  )
    throw new HcaError({
      code: "INVALID_PARAMETERS",
      message:
        "Wait options must be positive, confirmations integral, and maximum interval at least the initial interval",
    });

  return { timeout, confirmations, pollingInterval, maxPollingInterval };
};

const timedOut = () =>
  new HcaError({
    code: "INVALID_EXECUTION",
    message: "Execution wait timed out; retain the submission handle to resume",
  });

const stream = (
  config: EnsforgeConfig,
  parameters: WaitForHcaExecutionParameters,
): Stream.Stream<HcaExecutionStatus, WriteError> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const options = yield* Effect.try({
        try: () => waitOptions(config, parameters),
        catch: (cause) => cause as HcaError,
      });

      const deadline = (yield* Clock.currentTimeMillis) + options.timeout;

      const poll = Effect.fn("ensforge.watchHcaExecution.poll")(function* (attempt: number) {
        const remaining = deadline - (yield* Clock.currentTimeMillis);

        if (remaining <= 0) return yield* timedOut();

        return yield* Effect.gen(function* () {
          if (attempt > 0)
            yield* Effect.sleep(
              Math.min(
                options.pollingInterval * 2 ** Math.min(attempt - 1, 20),
                options.maxPollingInterval,
              ),
            );

          let status = yield* getHcaExecutionStatus.effect(config, parameters);

          if (status.status === "succeeded" || status.status === "failed") {
            const head = yield* hcaRpc(() => config.publicClient.getBlockNumber({ cacheTime: 0 }));

            for (const receipt of status.receipts) {
              // Reconcile destination receipts against the current chain before claiming finality.
              const canonical = yield* hcaRpc(() =>
                config.publicClient.getTransactionReceipt({ hash: receipt.transactionHash }),
              );

              const block = yield* hcaRpc(() =>
                config.publicClient.getBlock({ blockNumber: receipt.blockNumber }),
              );

              if (
                canonical.blockHash !== receipt.blockHash ||
                canonical.status !== receipt.status ||
                block.hash !== receipt.blockHash ||
                head < receipt.blockNumber + BigInt(options.confirmations - 1)
              ) {
                status = { status: "pending", submission: status.submission };

                break;
              }
            }
          }

          return [
            [status],
            status.status === "succeeded" ||
            status.status === "failed" ||
            status.status === "cancelled" ||
            status.status === "expired"
              ? Option.none<number>()
              : Option.some(attempt + 1),
          ] as const;
        }).pipe(
          Effect.timeout(remaining),
          Effect.catchTag("TimeoutError", () => timedOut()),
        );
      });

      return Stream.paginate(0, poll);
    }),
  );

export const waitForHcaExecution = defineAction<
  WaitForHcaExecutionParameters,
  HcaExecutionStatus,
  WriteError
>(
  Effect.fn("ensforge.waitForHcaExecution")(function* (config, parameters) {
    const result = yield* Stream.runLast(stream(config, parameters));

    if (Option.isNone(result)) return yield* timedOut();

    return result.value;
  }),
);

export interface WatchHcaExecution {
  (
    config: EnsforgeConfig,
    parameters: WaitForHcaExecutionParameters,
    onStatus: (status: HcaExecutionStatus) => void,
    onError: (error: WriteError) => void,
    options?: Effect.RunOptions,
  ): Promise<() => void>;

  readonly stream: typeof stream;
}

const watch: WatchHcaExecution = Object.assign(
  async (
    config: EnsforgeConfig,
    parameters: WaitForHcaExecutionParameters,
    onStatus: (status: HcaExecutionStatus) => void,
    onError: (error: WriteError) => void,
    options?: Effect.RunOptions,
  ) => {
    waitOptions(config, parameters);

    const controller = new AbortController();

    const abort = () => controller.abort();

    options?.signal?.addEventListener("abort", abort, { once: true });

    if (options?.signal?.aborted) abort();

    const run = Stream.runForEach(stream(config, parameters), (status) =>
      Effect.sync(() => onStatus(status)),
    ).pipe(Effect.catch((error) => Effect.sync(() => onError(error))));

    void Effect.runPromise(run, { ...options, signal: controller.signal })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          onError(
            new HcaError({ code: "ADAPTER_FAILED", message: "Execution watcher failed", cause }),
          );
      })
      .finally(() => options?.signal?.removeEventListener("abort", abort));

    return abort;
  },
  { stream },
);

export const watchHcaExecution = Object.freeze(watch);
