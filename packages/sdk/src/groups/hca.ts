import {
  predictHcaAddress,
  getHca,
  getHcaOwner,
  getHcaImplementation,
  getHcaAccountId,
  getHcaSessionNonce,
  getAuthorizedHcaOwner,
  getHcaImplementationApproval,
  verifyHca,
  getHcaCapabilities,
  deployHca,
  prepareHcaCalls,
  executeHcaCalls,
  getHcaExecutionStatus,
  waitForHcaExecution,
  revokeHcaSessions,
  type EnsforgeConfig,
} from "@ensforge/core";

import { bindAction, type BoundAction } from "../internal/bind-action.js";

export interface HcaActions {
  readonly predictHcaAddress: BoundAction<typeof predictHcaAddress>;
  readonly getHca: BoundAction<typeof getHca>;
  readonly getHcaOwner: BoundAction<typeof getHcaOwner>;
  readonly getHcaImplementation: BoundAction<typeof getHcaImplementation>;
  readonly getHcaAccountId: BoundAction<typeof getHcaAccountId>;
  readonly getHcaSessionNonce: BoundAction<typeof getHcaSessionNonce>;
  readonly getAuthorizedHcaOwner: BoundAction<typeof getAuthorizedHcaOwner>;
  readonly getHcaImplementationApproval: BoundAction<typeof getHcaImplementationApproval>;
  readonly verifyHca: BoundAction<typeof verifyHca>;
  readonly getHcaCapabilities: BoundAction<typeof getHcaCapabilities>;
  readonly deployHca: BoundAction<typeof deployHca>;
  readonly prepareHcaCalls: BoundAction<typeof prepareHcaCalls>;
  readonly executeHcaCalls: BoundAction<typeof executeHcaCalls>;
  readonly getHcaExecutionStatus: BoundAction<typeof getHcaExecutionStatus>;
  readonly waitForHcaExecution: BoundAction<typeof waitForHcaExecution>;
  readonly revokeHcaSessions: BoundAction<typeof revokeHcaSessions>;
}

export const makeHcaActions = (config: EnsforgeConfig): HcaActions =>
  Object.freeze({
    predictHcaAddress: bindAction(config, predictHcaAddress),
    getHca: bindAction(config, getHca),
    getHcaOwner: bindAction(config, getHcaOwner),
    getHcaImplementation: bindAction(config, getHcaImplementation),
    getHcaAccountId: bindAction(config, getHcaAccountId),
    getHcaSessionNonce: bindAction(config, getHcaSessionNonce),
    getAuthorizedHcaOwner: bindAction(config, getAuthorizedHcaOwner),
    getHcaImplementationApproval: bindAction(config, getHcaImplementationApproval),
    verifyHca: bindAction(config, verifyHca),
    getHcaCapabilities: bindAction(config, getHcaCapabilities),
    deployHca: bindAction(config, deployHca),
    prepareHcaCalls: bindAction(config, prepareHcaCalls),
    executeHcaCalls: bindAction(config, executeHcaCalls),
    getHcaExecutionStatus: bindAction(config, getHcaExecutionStatus),
    waitForHcaExecution: bindAction(config, waitForHcaExecution),
    revokeHcaSessions: bindAction(config, revokeHcaSessions),
  });
