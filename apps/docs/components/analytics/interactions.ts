import { pageProperties, safeUrl } from "../runtime/page-context";
import { track } from "./client";

const searchSelector = 'input[role="combobox"][aria-controls="search-results"]';

const searchKeydown = (event: KeyboardEvent) => {
  if (
    event.key !== "Enter" ||
    !(event.target instanceof Element) ||
    !event.target.matches(searchSelector)
  )
    return;
  // Vocs routes directly on Enter, without dispatching a link click.
  const selected = document.querySelector(
    '#search-results [role="option"][data-selected="true"] a[href]',
  );
  if (selected instanceof HTMLAnchorElement) {
    track("docs_search_result_clicked", { destination_path: new URL(selected.href).pathname });
  }
};

const click = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const copy = target.closest('button[aria-label="Copy code"], button[aria-label="Copy command"]');
  if (copy) {
    const pre = copy.closest("pre");
    track("docs_code_copy_clicked", {
      code_language: pre?.getAttribute("data-v-lang") ?? "unknown",
      code_source: copy.closest(".ensforge-demo") ? "playground_result" : "documentation",
      copy_kind: copy.hasAttribute("data-v-shell-copy") ? "command" : "block",
    });
  }
  if (target.closest("button[data-v-copy-for-ai]")) track("docs_ai_copy_clicked");
  const anchor = target.closest("a[href]");
  // Playground output can link to user-supplied content.
  if (!(anchor instanceof HTMLAnchorElement) || anchor.closest(".ensforge-demo")) return;
  const url = new URL(anchor.href);
  if (!["http:", "https:"].includes(url.protocol)) return;
  if (url.origin !== window.location.origin) {
    track("docs_outbound_clicked", {
      destination_url: safeUrl(url.href),
      destination_host: url.hostname,
    });
    return;
  }
  if (anchor.closest('[role="option"]')) {
    track("docs_search_result_clicked", { destination_path: url.pathname });
  }
  track("docs_navigation_clicked", {
    destination_path: url.pathname,
    destination_package: pageProperties(url.pathname).docs_package ?? "home",
    placement: anchor.closest(".ensforge-home")
      ? "homepage"
      : anchor.closest("nav")
        ? "navigation"
        : "content",
  });
};

export const observeInteractions = (): (() => void) => {
  const searched = new WeakSet<Element>();
  const opened = new WeakSet<Element>();

  const focus = (event: FocusEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.matches(searchSelector) || opened.has(target))
      return;
    opened.add(target);
    track("docs_search_opened");
  };
  const input = (event: Event) => {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement) ||
      !target.matches(searchSelector) ||
      !target.value.trim() ||
      searched.has(target)
    )
      return;
    searched.add(target);
    track("docs_search_used");
  };

  document.addEventListener("click", click, true);
  document.addEventListener("focusin", focus);
  document.addEventListener("input", input);
  document.addEventListener("keydown", searchKeydown, true);
  return () => {
    document.removeEventListener("click", click, true);
    document.removeEventListener("focusin", focus);
    document.removeEventListener("input", input);
    document.removeEventListener("keydown", searchKeydown, true);
  };
};
