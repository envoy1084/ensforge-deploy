import { Effect } from "effect";

import type { HcaDeploymentProfile } from "@ensforge/contracts/deployments";
import { verifyHcaDeployment as verifyProfile } from "@ensforge/core/testing";
import type { PublicClient } from "viem";

import { TestEnvironmentError } from "../errors/test-environment-error.js";
import type { HcaFixtureManifest } from "../fixtures/manifest.js";

export const verifyHcaDeployment: (
  client: PublicClient,
  profile: HcaDeploymentProfile,
  atBlock?: bigint,
) => Effect.Effect<HcaFixtureManifest["wiring"], TestEnvironmentError> = (...args) =>
  verifyProfile(...args).pipe(
    Effect.mapError(
      (cause) =>
        new TestEnvironmentError({
          code: "DEPLOYMENTS_INVALID",
          message: cause.message,
          cause,
        }),
    ),
  );
