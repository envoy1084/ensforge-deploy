import { isAddress } from "viem";

import { profile } from "./client";

const name = process.env.ENSFORGE_SEPOLIA_V2_NAME;
const resolver = process.env.ENSFORGE_HCA_REGISTRATION_RESOLVER;
if (!name || !resolver || !isAddress(resolver))
  throw new Error(
    "Set an available ENSFORGE_SEPOLIA_V2_NAME and compatible ENSFORGE_HCA_REGISTRATION_RESOLVER",
  );

export const registration = {
  name,
  resolver,
  paymentToken: profile.infrastructure.paymentToken,
  duration: 31_536_000n,
  limits: { registrationPrice: 10_000_000n, fees: [] },
};
