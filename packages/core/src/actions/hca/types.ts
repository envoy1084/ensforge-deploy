import { Schema, type Effect } from "effect";

import type { Address, Hex, TransactionReceipt } from "viem";

import type { BlockParameters } from "../../action/block.js";
import type { EnsWriteIntent } from "../../action/write-intent.js";
import type { EnsforgeConfig } from "../../config/config.js";
import type { HcaError } from "../../errors/hca-error.js";
import { Hex as HexSchema } from "../../schemas/hex.js";
import { EthereumAddress } from "../../schemas/identity.js";
import type { WalletOverrides, WriteError } from "../../write/types.js";
import type { HcaExecutionCapabilities } from "./execution-contract.js";

export const HcaSalt = Schema.BigInt.check(
  Schema.makeFilter<bigint>((value) =>
    value >= 0n && value < 1n << 256n ? true : "Expected uint256",
  ),
);
export const HcaCall = Schema.Struct({
  to: EthereumAddress,
  data: Schema.optional(HexSchema),
  value: Schema.optional(HcaSalt),
});
export type HcaCall = typeof HcaCall.Type;
export type HcaErrorResult = WriteError;
export type HcaReadParameters = BlockParameters & { readonly hca: Address };
export type HcaDerivationParameters = BlockParameters & {
  readonly owner: Address;
  readonly salt?: bigint;
  readonly implementation?: Address;
};
export type VerifyHcaParameters = HcaReadParameters & {
  readonly expectedOwner?: Address;
  readonly salt?: bigint;
  readonly initialImplementation?: Address;
};
export type HcaState =
  | {
      readonly status: "undeployed";
      readonly address: Address;
      readonly chainId: number;
      readonly blockNumber: bigint;
    }
  | {
      readonly status: "deployed";
      readonly address: Address;
      readonly chainId: number;
      readonly blockNumber: bigint;
      readonly owner: Address;
      readonly implementation: Address;
      readonly accountId: string;
      readonly sessionNonce: bigint;
    };

export interface VerifiedHcaAccount {
  readonly kind: "ens-hca";
  readonly address: Address;
  readonly owner: Address;
  readonly chainId: number;
  readonly profileId: string;
  readonly initialImplementation: Address;
  readonly currentImplementation: Address;
  readonly salt: bigint;
  readonly sessionNonce: bigint;
  readonly verifiedAtBlock: bigint;
}

export type HcaAuthorization =
  | { readonly kind: "owner" }
  | { readonly kind: "session"; readonly permissionId: Hex };
export interface PrepareHcaCallsParameters extends WalletOverrides {
  readonly operationId?: string;
  readonly requiredCapabilities?: readonly (keyof HcaExecutionCapabilities)[];
  readonly hca: Address;
  readonly salt?: bigint;
  readonly authorization: HcaAuthorization;
  readonly calls: readonly (HcaCall | EnsWriteIntent<unknown, WriteError>)[];
}
export interface PreparedHcaCalls {
  readonly operationId?: string;
  readonly requiredCapabilities?: readonly (keyof HcaExecutionCapabilities)[];
  readonly account: VerifiedHcaAccount;
  readonly authorization: { readonly kind: "owner" };
  readonly calls: readonly { readonly to: Address; readonly data: Hex; readonly value: bigint }[];
  readonly value: bigint;
  readonly data: Hex;
  readonly fingerprint: Hex;
  readonly simulation: "required";
}
export interface HcaExecutionIdentity {
  readonly operationId?: string | undefined;
  readonly adapterId: string;
  readonly instanceId: string;
  readonly chainId: number;
  readonly hca: Address;
  readonly profileId: string;
  readonly planFingerprint: Hex;
}
export interface PreparedHcaExecution<Payload = unknown> extends HcaExecutionIdentity {
  readonly payload: Payload;
  readonly simulation: "succeeded";
}
export interface AuthorizedHcaExecution<Payload = unknown> extends HcaExecutionIdentity {
  readonly payload: Payload;
}
export interface HcaAdapterSubmission<Payload = unknown> extends HcaExecutionIdentity {
  readonly kind: "adapter";
  readonly reference: string;
  readonly payload: Payload;
}
export interface HcaTransactionSubmission {
  readonly operationId?: string;
  readonly kind: "transaction";
  readonly chainId: number;
  readonly hca: Address;
  readonly owner: Address;
  readonly profileId: string;
  readonly hash: Hex;
  readonly planFingerprint: Hex;
}
export type HcaExecutionSubmission<Payload = unknown> =
  | HcaTransactionSubmission
  | HcaAdapterSubmission<Payload>;
export type HcaExecutionStatus<Payload = unknown> =
  | {
      readonly status: "cancelled" | "expired";
      readonly reason: string;
      readonly submission: HcaExecutionSubmission<Payload>;
    }
  | { readonly status: "pending" | "unknown"; readonly submission: HcaExecutionSubmission<Payload> }
  | {
      readonly status: "succeeded" | "failed";
      readonly submission: HcaExecutionSubmission<Payload>;
      readonly receipts: readonly TransactionReceipt[];
    };

/** Runtime adapters validate opaque payloads before invoking typed provider callbacks. */
export type HcaAdapterAction<Parameters, Success> = {
  invoke(
    config: EnsforgeConfig,
    parameters: Parameters,
    options?: Effect.RunOptions,
  ): Promise<Success>;
}["invoke"] & {
  effect(config: EnsforgeConfig, parameters: Parameters): Effect.Effect<Success, HcaError>;
};

/** Core remains independent of provider packages. */
export interface ExecutionAdapter<Prepared = unknown, Authorized = unknown, Submission = unknown> {
  readonly id: string;
  readonly instanceId: string;
  readonly capabilities?: HcaExecutionCapabilities;
  readonly supports: (plan: PreparedHcaCalls) => {
    readonly supported: boolean;
    readonly reason?: string;
  };
  readonly prepare: HcaAdapterAction<PreparedHcaCalls, PreparedHcaExecution<Prepared>>;
  readonly authorize: HcaAdapterAction<
    PreparedHcaExecution<Prepared>,
    AuthorizedHcaExecution<Authorized>
  >;
  readonly submit: HcaAdapterAction<
    AuthorizedHcaExecution<Authorized>,
    HcaAdapterSubmission<Submission>
  >;
  readonly getStatus: HcaAdapterAction<
    HcaAdapterSubmission<Submission>,
    HcaExecutionStatus<Submission>
  >;
}
export interface ExecuteHcaCallsParameters extends PrepareHcaCallsParameters {
  readonly execution?: ExecutionAdapter;
}
export interface HcaExecutionStatusParameters {
  readonly submission: HcaExecutionSubmission;
  readonly execution?: ExecutionAdapter;
}
export interface WaitForHcaExecutionParameters extends HcaExecutionStatusParameters {
  readonly confirmations?: number;
  readonly timeout?: number;
  readonly pollingInterval?: number;
  readonly maxPollingInterval?: number;
}
