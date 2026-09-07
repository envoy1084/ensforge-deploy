import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReadActionDemo } from "../components/read-actions/read-action-demo.client";

const analytics = vi.hoisted(() => ({ track: vi.fn(), execute: vi.fn() }));
vi.mock("../components/analytics/client", () => ({ track: analytics.track }));
vi.mock("../components/runtime/sdk", () => ({ getSdk: async () => ({}) }));
vi.mock("../components/read-actions/registry/manifest", () => ({
  loadReadAction: async () => ({ createForm: () => ({}), execute: analytics.execute }),
}));
vi.mock("../components/client-only.client", () => ({
  ClientOnly: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../components/wallet-connect/providers.client", () => ({ WalletProviders: () => null }));
vi.mock("../components/wallet-connect/wallet-connect-button.client", () => ({
  WalletConnectButton: () => null,
}));
vi.mock("../components/code/result-code-block", () => ({ ResultCodeBlock: () => null }));
vi.mock("@thenamespace/uikit/segment", () => ({
  Segment: Object.assign(({ children }: { children: ReactNode }) => <div>{children}</div>, {
    Item: () => null,
  }),
}));
vi.mock("../components/form/form-renderer", () => ({
  FormRenderer: ({
    onSubmit,
  }: {
    onSubmit: (values: Record<string, unknown>) => Promise<void>;
  }) => (
    <button type="button" onClick={() => void onSubmit({ name: "private.eth" })}>
      Run
    </button>
  ),
}));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("playground analytics", () => {
  it.each(["completed", "failed"])(
    "records one correlated %s outcome without input, output or raw errors",
    async (outcome) => {
      if (outcome === "completed")
        analytics.execute.mockResolvedValue({ owner: "private wallet result" });
      else analytics.execute.mockRejectedValue({ _tag: "RpcError", message: "private RPC URL" });

      await act(async () => root.render(<ReadActionDemo action="name.getOwner" />));
      await act(async () => container.querySelector("button")?.click());

      expect(analytics.track).toHaveBeenCalledTimes(2);
      expect(analytics.track).toHaveBeenNthCalledWith(
        1,
        "docs_playground_started",
        expect.objectContaining({
          action: "name.getOwner",
          network: "mainnet",
          run_id: expect.any(String),
        }),
      );
      const start = analytics.track.mock.calls[0]?.[1];
      expect(analytics.track).toHaveBeenNthCalledWith(
        2,
        `docs_playground_${outcome}`,
        expect.objectContaining({
          ...start,
          duration_ms: expect.any(Number),
          ...(outcome === "failed" ? { error_category: "RpcError" } : {}),
        }),
      );
      expect(JSON.stringify(analytics.track.mock.calls)).not.toContain("private");
    },
  );
});
