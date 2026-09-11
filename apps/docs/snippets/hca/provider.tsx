"use client";

import type { ReactNode } from "react";

import { EnsforgeProvider } from "@ensforge/react";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const publicClient = createPublicClient({ chain: sepolia, transport: http() });

export function Provider({ children }: { children: ReactNode }) {
  return (
    <EnsforgeProvider config={{ network: "sepolia", publicClient }}>{children}</EnsforgeProvider>
  );
}
