export type AnalyticsProperties = Readonly<Record<string, string | number | boolean>>;

export type DocsEvent =
  | "docs_navigation_clicked"
  | "docs_outbound_clicked"
  | "docs_code_copy_clicked"
  | "docs_ai_copy_clicked"
  | "docs_search_opened"
  | "docs_search_used"
  | "docs_search_result_clicked"
  | "docs_playground_started"
  | "docs_playground_completed"
  | "docs_playground_failed"
  | "docs_playground_network_changed"
  | "docs_wallet_connect_clicked";

export const pageProperties = (pathname: string): AnalyticsProperties => {
  const path = pathname.split(/[?#]/)[0] || "/";
  const segments = path.split("/").filter(Boolean);
  const packageName = segments[0] ?? "home";
  return {
    page_path: path,
    docs_package: ["contracts", "core", "sdk", "react"].includes(packageName)
      ? packageName
      : "home",
    page_type:
      path === "/" ? "home" : segments.includes("api") ? "api" : (segments[1] ?? "overview"),
  };
};

export const analyticsEnabled = (production: boolean, key: string, hostname: string): boolean =>
  production &&
  key.trim().length > 0 &&
  !/^(localhost|.*\.localhost|.*\.local|127(?:\.\d+){3}|0\.0\.0\.0|\[?::1\]?|10(?:\.\d+){3}|192\.168(?:\.\d+){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d+){2})$/i.test(
    hostname,
  );

export const safeUrl = (value: string): string => {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
};

// Error messages and causes can contain RPC URLs, ENS names, and returned records.
export const errorCategory = (error: unknown): string => {
  if (typeof error !== "object" || error === null || !("_tag" in error)) return "unexpected";
  const tags = [
    "NameError",
    "ConfigError",
    "RpcError",
    "ContractError",
    "CodecError",
    "GatewayError",
    "IndexerConfigError",
    "IndexerUnavailableError",
    "IndexerRequestError",
    "IndexerDecodeError",
    "IndexerGraphQLError",
    "AuthorizationError",
    "WalletError",
  ];
  const tag = Reflect.get(error, "_tag");
  return typeof tag === "string" && tags.includes(tag) ? tag : "unexpected";
};
