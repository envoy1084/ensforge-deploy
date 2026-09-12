import { owner, sdk } from "./client";

export const salt = 0n;
export const hca = await sdk.hca.predictHcaAddress({ owner: owner.address, salt });
