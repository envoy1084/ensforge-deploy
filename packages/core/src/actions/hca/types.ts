import { Schema } from "effect";

import type { Address, Hex, TransactionReceipt } from "viem";

import type { EnsAction } from "../../action/action.js";
import type { BlockParameters } from "../../action/block.js";
import type { EnsWriteIntent } from "../../action/write-intent.js";
import type { HcaError } from "../../errors/hca-error.js";
import { Hex as HexSchema } from "../../schemas/hex.js";
import { EthereumAddress } from "../../schemas/identity.js";
import type { WalletOverrides, WriteError } from "../../write/types.js";

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
  readonly hca: Address;
  readonly salt?: bigint;
  readonly authorization: HcaAuthorization;
  readonly calls: readonly (HcaCall | EnsWriteIntent<unknown, WriteError>)[];
}
export interface PreparedHcaCalls {
  readonly account: VerifiedHcaAccount;
  readonly authorization: { readonly kind: "owner" };
  readonly calls: readonly { readonly to: Address; readonly data: Hex; readonly value: bigint }[];
  readonly value: bigint;
  readonly data: Hex;
  readonly fingerprint: Hex;
  readonly simulation: "required";
}
export interface HcaExecutionIdentity {
  readonly adapterId: string;
  readonly instanceId: string;
  readonly chainId: number;
  readonly hca: Address;
  readonly profileId: string;
  readonly planFingerprint: Hex;
}
export interface PreparedHcaExecution extends HcaExecutionIdentity {
  readonly payload: unknown;
  readonly simulation: "succeeded";
}
export interface AuthorizedHcaExecution extends HcaExecutionIdentity {
  readonly payload: unknown;
}
export interface HcaAdapterSubmission extends HcaExecutionIdentity {
  readonly kind: "adapter";
  readonly reference: string;
  readonly payload: unknown;
}
export interface HcaTransactionSubmission {
  readonly kind: "transaction";
  readonly chainId: number;
  readonly hca: Address;
  readonly owner: Address;
  readonly profileId: string;
  readonly hash: Hex;
  readonly planFingerprint: Hex;
}
export type HcaExecutionSubmission = HcaTransactionSubmission | HcaAdapterSubmission;
export type HcaExecutionStatus =
  | { readonly status: "pending" | "unknown"; readonly submission: HcaExecutionSubmission }
  | {
      readonly status: "succeeded" | "failed";
      readonly submission: HcaExecutionSubmission;
      readonly receipts: readonly TransactionReceipt[];
    };

/** Provider delivery boundary; P1 supports owner authorization only. No provider packages in core. */
export interface ExecutionAdapter {
  readonly id: string;
  readonly instanceId: string;
  readonly supports: (plan: PreparedHcaCalls) => {
    readonly supported: boolean;
    readonly reason?: string;
  };
  readonly prepare: EnsAction<PreparedHcaCalls, PreparedHcaExecution, HcaError>;
  readonly authorize: EnsAction<PreparedHcaExecution, AuthorizedHcaExecution, HcaError>;
  readonly submit: EnsAction<AuthorizedHcaExecution, HcaAdapterSubmission, HcaError>;
  readonly getStatus: EnsAction<HcaAdapterSubmission, HcaExecutionStatus, HcaError>;
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
}
