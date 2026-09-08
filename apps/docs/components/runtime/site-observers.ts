import type * as AnalyticsClient from "../analytics/client";
import { analyticsEnabled, type AnalyticsProperties, type DocsEvent } from "./page-context";

let analytics: Promise<typeof AnalyticsClient | undefined> | undefined;

export const loadAnalytics = (): Promise<typeof AnalyticsClient | undefined> => {
  if (
    typeof window === "undefined" ||
    !analyticsEnabled(
      import.meta.env.PROD,
      import.meta.env.VITE_POSTHOG_KEY ?? "",
      window.location.hostname,
    ) ||
    !import.meta.env.VITE_POSTHOG_HOST?.trim()
  ) {
    return Promise.resolve(undefined);
  }

  // Keep the entire optional dependency tree out of page and playground module loading.
  analytics ??= import("../analytics/client").catch(() => {
    // oxlint-disable-next-line no-console -- A blocker may reject imports before SDK initialization.
    console.warn("Ensforge analytics could not load.");
    return undefined;
  });

  return analytics;
};

export const track = (event: DocsEvent, properties: AnalyticsProperties = {}): void => {
  void loadAnalytics()
    .then((client) => client?.track(event, properties))
    .catch(() => {
      // oxlint-disable-next-line no-console -- Optional telemetry must not interrupt UI actions.
      console.warn("Ensforge analytics event could not be captured.");
    });
};
