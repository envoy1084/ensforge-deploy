import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  analyticsEnabled,
  errorCategory,
  pageProperties,
  safeUrl,
} from "../components/analytics/events";

const posthog = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: posthog }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
  vi.stubEnv("VITE_POSTHOG_HOST", "https://proxy.example.com");
  vi.stubGlobal(
    "location",
    new URL("https://ensforge.com/sdk/getting-started?private=value#anchor"),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("production analytics", () => {
  it.each([
    "localhost",
    "127.0.0.1",
    "::1",
    "[::1]",
    "demo.localhost",
    "192.168.1.2",
    "10.0.0.5",
    "172.16.0.3",
  ])("blocks local production previews on %s", (hostname) => {
    expect(analyticsEnabled(true, "phc_test", hostname)).toBe(false);
  });

  it("requires production and a nonempty key", () => {
    expect(analyticsEnabled(false, "phc_test", "ensforge.com")).toBe(false);
    expect(analyticsEnabled(true, " ", "ensforge.com")).toBe(false);
    expect(analyticsEnabled(true, "phc_test", "ensforge.com")).toBe(true);
  });

  it("never initializes or captures in development even with credentials", async () => {
    vi.stubEnv("PROD", false);
    const { getAnalytics, track } = await import("../components/analytics/client");
    track("docs_playground_started", { action: "getOwner" });
    expect(await getAnalytics()).toBeUndefined();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it.each(["VITE_POSTHOG_KEY", "VITE_POSTHOG_HOST"])("stays disabled without %s", async (key) => {
    vi.stubEnv("PROD", true);
    vi.stubEnv(key, "");
    const { getAnalytics } = await import("../components/analytics/client");
    expect(await getAnalytics()).toBeUndefined();
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("initializes once through the proxy and preserves events while loading", async () => {
    vi.stubEnv("PROD", true);
    const { getAnalytics, track } = await import("../components/analytics/client");
    track("docs_playground_started", { action: "getOwner", network: "mainnet" });
    await Promise.all([getAnalytics(), getAnalytics()]);
    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://proxy.example.com",
        capture_pageview: "history_change",
        autocapture: false,
        disable_session_recording: true,
        capture_exceptions: false,
      }),
    );
    expect(posthog.capture).toHaveBeenCalledWith("docs_playground_started", {
      action: "getOwner",
      network: "mainnet",
      $current_url: "https://ensforge.com/sdk/getting-started",
    });
  });

  it("keeps delayed playground results attributed to the originating page", async () => {
    vi.stubEnv("PROD", true);
    const { track, getAnalytics } = await import("../components/analytics/client");
    track("docs_playground_completed", {
      $current_url: "https://ensforge.com/core/api/actions/name/get-owner",
    });
    await getAnalytics();
    expect(posthog.capture).toHaveBeenCalledWith(
      "docs_playground_completed",
      expect.objectContaining({
        $current_url: "https://ensforge.com/core/api/actions/name/get-owner",
      }),
    );
  });

  it("removes URL queries and fragments while retaining useful page context", async () => {
    const { beforeSend } = await import("../components/analytics/client");
    const result = beforeSend({
      uuid: "00000000-0000-4000-8000-000000000001",
      event: "$pageview",
      properties: {
        $current_url:
          "https://ensforge.com/core/api/actions/records/get-text?name=private.eth#secret",
        $referrer: "https://example.com/?token=secret",
        $session_entry_referrer: "https://example.com/?token=secret",
        $session_entry_pathname: "/sdk?name=private.eth",
      },
    });
    expect(result?.properties).toMatchObject({
      $current_url: "https://ensforge.com/core/api/actions/records/get-text",
      $referrer: "https://example.com/",
      $session_entry_referrer: "https://example.com/",
      $session_entry_pathname: "/sdk",
      docs_package: "core",
      page_type: "api",
      app: "ensforge-docs",
      environment: "production",
    });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("private.eth");
  });

  it("does not expose arbitrary errors, causes, or URLs", () => {
    expect(errorCategory({ _tag: "RpcError", message: "private.eth", cause: "secret" })).toBe(
      "RpcError",
    );
    expect(errorCategory({ _tag: "private.eth" })).toBe("unexpected");
    expect(errorCategory(new Error("secret"))).toBe("unexpected");
    expect(safeUrl("invalid")).toBe("");
    expect(pageProperties("/react/getting-started?token=secret")).toMatchObject({
      docs_package: "react",
      page_type: "getting-started",
    });
  });
});
