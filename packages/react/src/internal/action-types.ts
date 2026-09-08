import type { Effect } from "effect";

export interface BoundEffectAction<Parameters, Success, Failure> {
  readonly effect: (parameters: Parameters) => Effect.Effect<Success, Failure>;
}

export type ActionParameters<Action extends BoundEffectAction<never, unknown, unknown>> =
  Parameters<Action["effect"]> extends [infer Input, ...unknown[]] ? Input : Record<never, never>;

export type ActionSuccess<Action extends BoundEffectAction<never, unknown, unknown>> =
  Effect.Success<ReturnType<Action["effect"]>>;

export type ActionFailure<Action extends BoundEffectAction<never, unknown, unknown>> = Effect.Error<
  ReturnType<Action["effect"]>
>;
