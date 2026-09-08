import type { EnsV1Deployment, EnsV2Deployment } from "@ensforge/contracts/deployments";

/** Runtime deployments retain provenance when supplied, but do not require it. */
export type EnsV1ConfigDeployment = Omit<EnsV1Deployment, "provenance"> &
  Partial<Pick<EnsV1Deployment, "provenance">>;

export type EnsV2ConfigDeployment = Omit<EnsV2Deployment, "provenance"> &
  Partial<Pick<EnsV2Deployment, "provenance">>;

type DeploymentMetadata = "id" | "chainId" | "protocol" | "status";

export type EnsV1DeploymentConfig = Omit<EnsV1ConfigDeployment, DeploymentMetadata> &
  Partial<Pick<EnsV1Deployment, "status">>;

export type EnsV2DeploymentConfig = Omit<EnsV2ConfigDeployment, DeploymentMetadata> &
  Partial<Pick<EnsV2Deployment, "status">>;

/** An ENS-compatible deployment on a single chain. IDs must be unique across deployments. */
export type CustomEnsNetwork = {
  readonly id: string;
  readonly chainId: number;
} & (
  | { readonly protocol: "v1"; readonly v1: EnsV1DeploymentConfig; readonly v2?: never }
  | {
      readonly protocol: "v2";
      readonly v1?: EnsV1DeploymentConfig;
      readonly v2: EnsV2DeploymentConfig;
    }
);
