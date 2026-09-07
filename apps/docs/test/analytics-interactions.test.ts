import { afterEach, describe, expect, it, vi } from "vitest";

import { track } from "../components/analytics/client";
import { observeInteractions } from "../components/analytics/interactions";

vi.mock("../components/analytics/client", () => ({ track: vi.fn() }));

afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("documentation interactions", () => {
  it("captures copy intent without reading code or playground output", () => {
    const stop = observeInteractions();
    const pre = document.createElement("pre");
    pre.setAttribute("data-v-lang", "typescript");
    const button = document.createElement("button");
    button.setAttribute("aria-label", "Copy code");
    pre.append("private.eth secret wallet address", button);
    document.body.append(pre);
    button.click();
    expect(track).toHaveBeenCalledWith("docs_code_copy_clicked", {
      code_language: "typescript",
      code_source: "documentation",
      copy_kind: "block",
    });
    stop();
    button.click();
    expect(track).toHaveBeenCalledOnce();
  });

  it("tracks search usage once per dialog without sending search terms", () => {
    const stop = observeInteractions();
    const input = document.createElement("input");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-controls", "search-results");
    document.body.append(input);
    input.focus();
    input.value = "private.eth";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(track).toHaveBeenCalledWith("docs_search_opened");
    expect(track).toHaveBeenCalledWith("docs_search_used");
    expect(track).toHaveBeenCalledTimes(2);
    stop();
  });

  it("does not track links in user-controlled playground results", () => {
    const stop = observeInteractions();
    const section = document.createElement("section");
    section.className = "ensforge-demo";
    const anchor = document.createElement("a");
    anchor.href = "https://private.example/private.eth";
    section.append(anchor);
    document.body.append(section);
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(track).not.toHaveBeenCalled();
    stop();
  });

  it("tracks keyboard search selection without capturing query text", () => {
    const stop = observeInteractions();
    const input = document.createElement("input");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-controls", "search-results");
    input.value = "private.eth";
    const list = document.createElement("div");
    list.id = "search-results";
    const option = document.createElement("div");
    option.setAttribute("role", "option");
    option.setAttribute("data-selected", "true");
    const anchor = document.createElement("a");
    anchor.href = "https://ensforge.com/sdk/getting-started";
    option.append(anchor);
    list.append(option);
    document.body.append(input, list);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(track).toHaveBeenCalledWith("docs_search_result_clicked", {
      destination_path: "/sdk/getting-started",
    });
    stop();
  });
});
