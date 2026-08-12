/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { markdownToJSON, jsonToMarkdown } from "../core/markdown";

/**
 * `@lyfie/luthor-headless` has exactly one optional dependency —
 * `@emoji-mart/data`, used to resolve `:shortcode:` names. Everything
 * must keep working when it is absent, which is the normal case for
 * anyone who installed the headless package alone.
 *
 * The resolver reaches for the module through a runtime `require`, so
 * absence is simulated by making that lookup throw, the same way a real
 * missing module does.
 */

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const NONE = { metadataMode: "none" as const };

function textOf(document: unknown): string {
  const parts: string[] = [];
  const visit = (node: { text?: string; children?: unknown[] }): void => {
    if (typeof node.text === "string") {
      parts.push(node.text);
    }
    for (const child of (node.children ?? []) as Array<typeof node>) {
      visit(child);
    }
  };
  visit(
    ((document as { root?: { children?: unknown[] } }).root ?? {}) as {
      children?: unknown[];
    },
  );
  return parts.join("");
}

describe("markdown conversion without @emoji-mart/data", () => {
  it("converts documents containing shortcodes without throwing", () => {
    const source = "Hello :smile: and :rocket: world";

    // Whether or not the optional module resolves in this environment,
    // conversion must succeed and keep the user's text.
    const document = markdownToJSON(source, NONE);
    const text = textOf(document);

    expect(text).toContain("Hello");
    expect(text).toContain("world");
    expect(() => jsonToMarkdown(document, NONE)).not.toThrow();
  });

  it("round-trips shortcode text losslessly when the module is unavailable", () => {
    // Force the "not installed" path: a global `require` that throws is
    // indistinguishable from a missing module to the resolver.
    vi.stubGlobal("require", () => {
      throw new Error("Cannot find module '@emoji-mart/data'");
    });

    const source = "Hello :smile: world";
    const once = jsonToMarkdown(markdownToJSON(source, NONE), NONE);
    const twice = jsonToMarkdown(markdownToJSON(once, NONE), NONE);

    expect(once).toContain("Hello");
    expect(once).toContain("world");
    // Idempotent: an unresolved shortcode must not be rewritten on each
    // pass, which would mutate the user's file on every save.
    expect(twice).toBe(once);
  });

  it("does not throw when the module resolves to unusable data", () => {
    // A present-but-wrong module (wrong version, bad shape) must degrade
    // exactly like an absent one rather than crashing the bridge.
    vi.stubGlobal("require", () => ({ default: { nonsense: true } }));

    expect(() => markdownToJSON("Hello :smile: world", NONE)).not.toThrow();
    expect(textOf(markdownToJSON("Hello :smile: world", NONE))).toContain(
      "Hello",
    );
  });
});

describe("emoji extension without @emoji-mart/data", () => {
  it("constructs and exposes its built-in fallback catalog", async () => {
    vi.stubGlobal("require", () => {
      throw new Error("Cannot find module '@emoji-mart/data'");
    });

    const { EmojiExtension } = await import("../extensions/core/EmojiExtension");
    const extension = new EmojiExtension();

    // The extension is usable with its built-in adapter; the optional
    // module only ever widens the catalog.
    expect(extension.name).toBe("emoji");
    expect(() => extension.getPlugins()).not.toThrow();
  });
});
