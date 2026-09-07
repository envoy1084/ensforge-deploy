import type { BeforeSendFn, PostHog } from "posthog-js";

import {
  analyticsEnabled,
  pageProperties,
  safeUrl,
  type AnalyticsProperties,
  type DocsEvent,
} from "./events";

let client: Promise<PostHog | undefined> | undefined;

export const beforeSend: BeforeSendFn = (event) => {
  if (!event) return null;
  const properties = event.properties;
  for (const key of [
    "$current_url",
    "$referrer",
    "$initial_current_url",
    "$initial_referrer",
    "$prev_pageview_pathname",
    "$session_entry_url",
    "$session_entry_referrer",
    "$session_entry_pathname",
    "$session_exit_url",
    "$session_exit_pathname",
  ]) {
    if (typeof properties[key] === "string") {
      properties[key] = key.endsWith("pathname")
        ? properties[key].split(/[?#]/)[0]
        : safeUrl(properties[key]);
    }
  }
  const url = typeof properties.$current_url === "string" ? properties.$current_url : "";
  const path = url ? new URL(url).pathname : "/";
  Object.assign(properties, pageProperties(path), {
    app: "ensforge-docs",
    environment: "production",
    analytics_version: 1,
  });
  return event;
};

export const getAnalytics = (): Promise<PostHog | undefined> => {
  const key = import.meta.env.VITE_POSTHOG_KEY ?? "";
  const host = import.meta.env.VITE_POSTHOG_HOST?.trim();
  if (
    typeof window === "undefined" ||
    !analyticsEnabled(import.meta.env.PROD, key, window.location.hostname) ||
    !host
  ) {
    return Promise.resolve(undefined);
  }

  client ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key.trim(), {
        api_host: host,
        ui_host: "https://us.posthog.com",
        defaults: "2025-11-30",
        capture_pageview: "history_change",
        capture_pageleave: true,
        autocapture: false,
        capture_dead_clicks: false,
        rageclick: false,
        capture_exceptions: false,
        capture_performance: false,
        disable_session_recording: true,
        disable_surveys: true,
        person_profiles: "identified_only",
        persistence: "localStorage",
        cross_subdomain_cookie: false,
        before_send: beforeSend,
      });
      return posthog;
    })
    .catch(() => {
      // Analytics is optional; blocked SDK loading must not break documentation or demos.
      // oxlint-disable-next-line no-console -- Report optional analytics failure without exposing its cause.
      console.warn("Ensforge analytics could not initialize.");
      return undefined;
    });
  return client;
};

export const track = (event: DocsEvent, properties: AnalyticsProperties = {}): void => {
  if (typeof window === "undefined") return;
  const url = safeUrl(window.location.href);
  void getAnalytics()
    .then((posthog) => {
      return posthog?.capture(event, {
        ...properties,
        $current_url: properties.$current_url ?? url,
      });
    })
    .catch(() => {
      // oxlint-disable-next-line no-console -- Report optional analytics failure without exposing its cause.
      console.warn("Ensforge analytics event could not be captured.");
    });
};
