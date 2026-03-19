import { describe, expect, it } from "vitest";
import {
  getRuntimeSupportedCodeLanguagesSnapshot,
  isKnownCodeLanguage,
  isRuntimeSupportedCodeLanguage,
  normalizeCodeLanguageId,
  normalizeKnownCodeLanguageId,
  refreshRuntimeSupportedCodeLanguages,
} from "./codeLanguageSupport";

describe("codeLanguageSupport", () => {
  it("normalizes common aliases to canonical language ids", () => {
    expect(normalizeCodeLanguageId("js")).toBe("javascript");
    expect(normalizeCodeLanguageId("ts")).toBe("typescript");
    expect(normalizeCodeLanguageId("py")).toBe("python");
    expect(normalizeCodeLanguageId("JS")).toBe("javascript");
    expect(normalizeCodeLanguageId("")).toBeNull();
    expect(normalizeCodeLanguageId("auto")).toBeNull();
  });

  it("only treats runtime-supported languages as known", () => {
    expect(isKnownCodeLanguage("javascript")).toBe(true);
    expect(normalizeKnownCodeLanguageId("js")).toBe("javascript");
    expect(isKnownCodeLanguage("dockerfile")).toBe(false);
    expect(normalizeKnownCodeLanguageId("made-up-language")).toBeNull();
  });

  it("returns stable runtime language snapshots", () => {
    refreshRuntimeSupportedCodeLanguages();
    const refreshed = refreshRuntimeSupportedCodeLanguages();
    const snapshot = getRuntimeSupportedCodeLanguagesSnapshot();
    expect(refreshed.size).toBeGreaterThan(0);
    expect(snapshot.size).toBeGreaterThan(0);
    expect(isRuntimeSupportedCodeLanguage("javascript")).toBe(true);
  });
});
