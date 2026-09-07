# ensforge docs

The documentation site is built with Vocs and rendered dynamically with Waku.

```sh
pnpm --filter @ensforge/docs dev
pnpm --filter @ensforge/docs build
pnpm --filter @ensforge/docs preview
```

The production site defaults to `https://ensforge.com`. Set `SITE_URL` during preview deployments to
override canonical URLs and the generated sitemap hostname.

Interactive indexer examples use same-origin server routes so upstream credentials and CORS policies
are not exposed to the browser. Configure custom endpoints with the server-only
`ENSFORGE_MAINNET_V1_INDEXER_URL`, `ENSFORGE_SEPOLIA_V1_INDEXER_URL`, and
`ENSFORGE_SEPOLIA_V2_INDEXER_URL` variables. Do not give indexer credentials a `VITE_` prefix.

Vocs generates the sitemap, robots directives, `llms.txt`, `llms-full.txt`, per-page Markdown, and
the MCP endpoint as part of the application.

## Production analytics

Set these **build-time** variables for the production docs deployment (see `.env.example`):

```dotenv
VITE_POSTHOG_KEY=your_project_token
VITE_POSTHOG_HOST=https://t.envoy1084.xyz
```

Use the public project token from the Ensforge PostHog project, never a personal API key. The key is
intentionally left unset in the repository. Rebuild after changing either variable; Turbo includes
both in its build cache key. Set them only for production in the hosting provider, not preview
environments: Vite also treats preview deployment builds as production builds.

PostHog loads after hydration only when `import.meta.env.PROD` is true and both variables are set.
Development, SSR, localhost, and local-network previews do not initialize the SDK or send events,
even with a key configured. Missing configuration disables analytics. The official `posthog-js`
SDK owns SPA pageviews, page leaves, session identity, and delivery through the managed proxy.

Every event includes `app=ensforge-docs`, `environment=production`, `analytics_version`, `page_path`,
`docs_package`, and `page_type`. Standard PostHog browser, session, referrer, and campaign properties
support traffic analysis. Additional events are:

| Events                                                                           | Meaning and additional properties                                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `docs_navigation_clicked`                                                        | Destination path/package and placement                                                                              |
| `docs_outbound_clicked`                                                          | External destination host and URL without query/fragment                                                            |
| `docs_code_copy_clicked`                                                         | Code language, block/command, documentation/playground result                                                       |
| `docs_ai_copy_clicked`                                                           | Copy page for AI button intent                                                                                      |
| `docs_search_opened`, `docs_search_used`, `docs_search_result_clicked`           | Search interaction, without query text                                                                              |
| `docs_playground_started`, `docs_playground_completed`, `docs_playground_failed` | Action, network, random run ID; terminal events add duration in milliseconds; failures add a bounded error category |
| `docs_playground_network_changed`                                                | Action, previous network, selected network                                                                          |
| `docs_wallet_connect_clicked`                                                    | Connection intent only                                                                                              |

Copy events measure button clicks, not verified clipboard success or package installations. A
completed playground run means the SDK returned, including valid empty results. Navigation can
interrupt runs; `run_id` correlates terminal events with their start. No analytics is added to the
published packages or server-side indexer proxy.

Wallet addresses, ENS inputs, form values, SDK results, code contents, and raw errors are excluded.
URL queries/fragments are removed before event delivery. Generic autocapture, session replay,
exception autocapture, and surveys are disabled; no visitor is identified by wallet. Visitor counts
use anonymous browser identity and can change when browser storage is cleared.

Reports in project `598348`:

- [Documentation adoption](https://us.posthog.com/project/598348/dashboard/2073573): traffic,
  acquisition, package interest, code reuse intent, search, outbound links, and adoption funnels.
- [Playground reliability](https://us.posthog.com/project/598348/dashboard/2073575): demand,
  completion/failure counts, error categories, latency, networks, and wallet connection intent.

Run `pnpm --filter @ensforge/docs test` for analytics regression tests. After deploying with the key,
verify `/i/v0/e/` requests (or the SDK's current event endpoint) use the configured proxy and that
events appear in PostHog. Local tests mock delivery and never seed fake production events.

## Authoring reference pages

API pages are written individually so their usage, parameters, return values, and examples can stay
specific to each operation. Repeated reference sections live in `shared/` and are imported into MDX
pages as components.

- `shared/core/` documents the dual Promise and Effect APIs used by Core actions.
- `shared/sdk/` documents the corresponding grouped SDK methods.
- `shared/react/` documents atom options, suspense behavior, and mutation results.
- `shared/contracts/` documents the common guidance for complete ABIs and focused fragments.

Keep operation-specific details on the reference page. Add content to a shared partial only when its
meaning and wording are identical everywhere it is included. Shared partials are excluded from page
generation, local search, the sitemap, and the generated LLM documentation.
