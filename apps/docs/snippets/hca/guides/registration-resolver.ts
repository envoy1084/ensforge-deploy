import { enhancedAccessControlRoles } from "@ensforge/contracts/v2";

/* oxlint-disable no-console -- Runnable guide reports the resolver configuration. */
import "./deploy";
import { hca } from "./account";
import { owner, sdk } from "./client";

const deployment = await sdk.resolution.createResolver({
  salt: 1n,
  grants: [
    { account: hca, roleBitmap: enhancedAccessControlRoles.allRoles },
    { account: owner.address, roleBitmap: enhancedAccessControlRoles.allRoles },
  ],
});
if (!("resolver" in deployment)) throw new Error("Resolver deployment did not complete");

console.log({ ENSFORGE_HCA_REGISTRATION_RESOLVER: deployment.resolver });
