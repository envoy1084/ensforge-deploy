"use client";

import { useEffect } from "react";

import { loadAnalytics } from "./runtime/site-observers";

export function SiteEffects() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void loadAnalytics()
      .then(async (analytics) => {
        if (!analytics || disposed || !(await analytics.getAnalytics())) return undefined;

        const { observeInteractions } = await import("./analytics/interactions");
        if (!disposed) cleanup = observeInteractions();
        return undefined;
      })
      .catch(() => {
        // A blocked optional module must never reach the page's React error boundary.
        // oxlint-disable-next-line no-console -- Do not expose URLs or SDK error details.
        console.warn("Ensforge page analytics could not initialize.");
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return null;
}
