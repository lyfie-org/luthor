import { describe, expect, it, vi } from "vitest";
import {
  getFallbackCodeTheme,
  resolveCodeHighlightProvider,
  resolveCodeTokenizer,
  resetCodeHighlightProviderCacheForTests,
  type CodeHighlightProvider,
} from "./codeHighlightProvider";

describe("codeHighlightProvider", () => {
  it("returns injected provider when configured", async () => {
    const provider: CodeHighlightProvider = {
      highlightAuto: vi.fn().mockReturnValue({ language: "typescript" }),
    };

    const resolved = await resolveCodeHighlightProvider({ provider });

    expect(resolved).toBe(provider);
  });

  it("returns null when no provider is configured", async () => {
    const resolved = await resolveCodeHighlightProvider({
      provider: null,
    });

    expect(resolved).toBeNull();
    resetCodeHighlightProviderCacheForTests();
  });

  it("resolves tokenizer from provider", async () => {
    const tokenizer = {
      defaultLanguage: "plaintext",
      tokenize: vi.fn().mockReturnValue(["hello"]),
    };

    const resolved = await resolveCodeTokenizer({
      getTokenizer: async () => tokenizer,
    });

    expect(resolved).toBe(tokenizer);
  });

  it("returns the standard fallback theme token", () => {
    expect(getFallbackCodeTheme()).toBe("plain");
  });
});
