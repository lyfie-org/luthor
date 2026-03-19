import { describe, expect, it } from "vitest";
import { loadPrismLanguages } from "./prismLanguageLoader";
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
    expect(normalizeCodeLanguageId("sh")).toBe("bash");
    expect(normalizeCodeLanguageId("dockerfile")).toBe("docker");
    expect(normalizeCodeLanguageId("cs")).toBe("csharp");
    expect(normalizeCodeLanguageId("JS")).toBe("javascript");
    expect(normalizeCodeLanguageId("")).toBeNull();
    expect(normalizeCodeLanguageId("auto")).toBeNull();
  });

  it("treats optional prism languages as known before eager runtime support", () => {
    expect(isKnownCodeLanguage("dockerfile")).toBe(true);
    expect(isKnownCodeLanguage("graphql")).toBe(true);
    expect(normalizeKnownCodeLanguageId("yml")).toBe("yaml");
    expect(normalizeKnownCodeLanguageId("made-up-language")).toBeNull();
  });

  it("refreshes runtime language snapshots after dynamic prism language loads", async () => {
    refreshRuntimeSupportedCodeLanguages();
    await loadPrismLanguages(["docker", "graphql"]);
    const refreshed = refreshRuntimeSupportedCodeLanguages();
    const snapshot = getRuntimeSupportedCodeLanguagesSnapshot();

    expect(refreshed.has("docker")).toBe(true);
    expect(refreshed.has("graphql")).toBe(true);
    expect(snapshot.has("docker")).toBe(true);
    expect(snapshot.has("graphql")).toBe(true);
    expect(isRuntimeSupportedCodeLanguage("dockerfile")).toBe(true);
  });
});

