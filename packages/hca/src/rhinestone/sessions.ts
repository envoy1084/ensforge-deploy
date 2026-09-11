import { Effect } from "effect";

import { defineAction, HcaError } from "@ensforge/core";
import { enableHcaSession, enableHcaSessionWithRefund, prepareHcaCalls } from "@ensforge/core/hca";
import type { RhinestoneSDK } from "@rhinestone/sdk";
import { getPermissionId } from "@rhinestone/sdk/smart-sessions";

import { createRhinestoneHca, sessionFor } from "./account.js";
import type { PreparedRhinestoneSession, RhinestoneOptions, RhinestoneSessions } from "./types.js";

export const createRhinestoneSessions = (
  options: RhinestoneOptions,
  sdk: RhinestoneSDK,
): RhinestoneSessions => {
  const prepared = new WeakSet<object>();

  return {
    prepare: defineAction((config, parameters) =>
      Effect.tryPromise({
        try: async () => {
          const { account } = await createRhinestoneHca(
            options,
            sdk,
            config,
            parameters.hca,
            parameters.salt,
          );

          const permissionId = getPermissionId(sessionFor(options, account.address));
          const result: PreparedRhinestoneSession = Object.freeze({
            parameters: Object.freeze({
              ...parameters,
              permissionId,
              sessionKey: options.sessionSigner.address,
              ...(parameters.refund === undefined
                ? {}
                : { refund: Object.freeze({ ...parameters.refund }) }),
            }),
            sessionNonce: account.sessionNonce,
            chainId: account.chainId,
            profileId: account.profileId,
          });

          const intent =
            result.parameters.refund === undefined
              ? enableHcaSession.call(result.parameters)
              : enableHcaSessionWithRefund.call({
                  ...result.parameters,
                  refund: result.parameters.refund,
                });

          await prepareHcaCalls(config, {
            hca: account.address,
            salt: account.salt,
            authorization: { kind: "owner" },
            calls: [intent],
          });

          prepared.add(result);

          return result;
        },
        catch: (cause) =>
          cause instanceof HcaError
            ? cause
            : new HcaError({
                code: "ADAPTER_FAILED",
                message: "Rhinestone operation failed",
                cause,
              }),
      }),
    ),
    enable: defineAction((config, session) =>
      Effect.tryPromise({
        try: async () => {
          if (!prepared.has(session))
            throw new HcaError({
              code: "ADAPTER_MISMATCH",
              message: "Prepare session enablement with this adapter first",
            });

          const { account } = await createRhinestoneHca(
            options,
            sdk,
            config,
            session.parameters.hca,
            session.parameters.salt,
          );

          if (account.sessionNonce !== session.sessionNonce)
            throw new HcaError({
              code: "INVALID_EXECUTION",
              message: "Session nonce changed; prepare enablement again",
            });

          prepared.delete(session);

          return session.parameters.refund === undefined
            ? enableHcaSession(config, session.parameters)
            : enableHcaSessionWithRefund(config, {
                ...session.parameters,
                refund: session.parameters.refund,
              });
        },
        catch: (cause) =>
          cause instanceof HcaError
            ? cause
            : new HcaError({
                code: "ADAPTER_FAILED",
                message: "Rhinestone operation failed",
                cause,
              }),
      }),
    ),
  };
};
