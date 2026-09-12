import { zeroAddress } from "viem";

import { hca } from "./account";
import { sdk } from "./client";

export const name = "your-name.eth";
const permissions = await sdk.capabilities.getRecordPermissions({
  name,
  account: hca,
  records: [{ type: "text", key: "description" }],
});

const configuredResolver = permissions.resolver;
if (!configuredResolver || configuredResolver === zeroAddress)
  throw new Error("The name needs a resolver");

export const resolver = configuredResolver;

if (permissions.records[0]?.authorization.status !== "authorized") {
  await sdk.permissions.setRecordPermissions({
    name,
    account: hca,
    records: [{ type: "text", key: "description" }],
    approved: true,
    mode: "sequential",
    atomicity: "none",
    allowScopeWidening: false,
  });
}
