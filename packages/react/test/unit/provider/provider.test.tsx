import type { ReactNode } from "react";

import { createMemoryWorkflowStorage } from "@ensforge/core/storage";
import { createIndexedDbWorkflowStorage } from "@ensforge/core/storage/browser";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EnsforgeProvider, useEnsforge } from "../../../src/index.js";
import { makePublicClient, makeSdk } from "../fixtures/sdk.js";

vi.mock("@ensforge/core/storage/browser", () => ({
  createIndexedDbWorkflowStorage: vi.fn(() => createMemoryWorkflowStorage()),
}));

beforeEach(() => vi.clearAllMocks());

describe("EnsforgeProvider", () => {
  it("provides an existing SDK", () => {
    const sdk = makeSdk();

    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <EnsforgeProvider sdk={sdk}>{children}</EnsforgeProvider>
    );

    const { result } = renderHook(useEnsforge, { wrapper });

    expect(result.current).toBe(sdk);
    expect(createIndexedDbWorkflowStorage).not.toHaveBeenCalled();
  });

  it("creates one stable SDK from config", () => {
    const publicClient = makePublicClient();

    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <EnsforgeProvider config={{ network: "mainnet", publicClient }}>{children}</EnsforgeProvider>
    );

    const { result, rerender } = renderHook(useEnsforge, { wrapper });
    const sdk = result.current;

    rerender();

    expect(result.current).toBe(sdk);
    expect(result.current.config.publicClient).toBe(publicClient);
    expect(createIndexedDbWorkflowStorage).toHaveBeenCalledTimes(1);
    expect(result.current.config.storage).toBeDefined();
  });

  it("preserves an explicit store instead of opening IndexedDB", () => {
    const storage = createMemoryWorkflowStorage();
    const publicClient = makePublicClient();
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <EnsforgeProvider config={{ network: "mainnet", publicClient, storage }}>
        {children}
      </EnsforgeProvider>
    );
    const { result } = renderHook(useEnsforge, { wrapper });
    expect(result.current.config.storage).toBe(storage);
    expect(createIndexedDbWorkflowStorage).not.toHaveBeenCalled();
  });

  it("rejects hooks outside the provider", () => {
    expect(() => renderHook(useEnsforge)).toThrow(
      "Ensforge React hooks must be used inside an EnsforgeProvider",
    );
  });
});
