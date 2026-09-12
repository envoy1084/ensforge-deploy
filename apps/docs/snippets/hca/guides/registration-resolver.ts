/* oxlint-disable no-console -- Runnable guide reports the resolver configuration. */
import "./deploy";
import { hca } from "./account";
import { sdk } from "./client";

const deployment = await sdk.resolution.createResolver({
  salt: 1n,
  admin: hca,
});
if (!("resolver" in deployment)) throw new Error("Resolver deployment did not complete");

console.log({ ENSFORGE_HCA_REGISTRATION_RESOLVER: deployment.resolver });
