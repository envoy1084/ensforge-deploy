import defineConfig from "klarity/tsdown/library";
import type { UserConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    pimlico: "src/providers/pimlico.ts",
    alchemy: "src/providers/alchemy.ts",
    rhinestone: "src/providers/rhinestone.ts",
  },
  exports: { devExports: "workspace-source" },
  unbundle: true,
  publint: "ci-only",
  attw: { enabled: "ci-only", level: "error", profile: "esm-only" },
}) as UserConfig;
