import { getCodeLanguages, normalizeCodeLang } from "@lexical/code";
import { describe, expect, it } from "vitest";
import {
  getDefaultPopularPrismLanguages,
  loadPopularPrismLanguages,
  loadPrismLanguages,
} from "./prismLanguageLoader";

function getNormalizedLoadedLanguages(): Set<string> {
  return new Set(
    getCodeLanguages()
      .map((id) => normalizeCodeLang(id.trim().toLowerCase()))
      .filter((id): id is string => Boolean(id)),
  );
}

describe("prismLanguageLoader", () => {
  it("exposes the default popular language preload list", () => {
    const defaults = getDefaultPopularPrismLanguages();
    expect(defaults).toContain("bash");
    expect(defaults).toContain("json");
    expect(defaults).toContain("yaml");
    expect(defaults).toContain("docker");
    expect(defaults).toContain("graphql");
    expect(defaults).toContain("toml");
    expect(defaults).toContain("tsx");
  });

  it("loads requested prism languages when grammar modules are available", async () => {
    await loadPrismLanguages([
      "bash",
      "json",
      "yaml",
      "go",
      "dockerfile",
      "graphql",
      "toml",
    ]);
    const loaded = getNormalizedLoadedLanguages();
    expect(loaded.has("bash")).toBe(true);
    expect(loaded.has("json")).toBe(true);
    expect(loaded.has("yaml")).toBe(true);
    expect(loaded.has("go")).toBe(true);
    expect(loaded.has("docker")).toBe(true);
    expect(loaded.has("graphql")).toBe(true);
    expect(loaded.has("toml")).toBe(true);
  });

  it("loads the default popular language bundle", async () => {
    await loadPopularPrismLanguages();
    const loaded = getNormalizedLoadedLanguages();
    expect(loaded.has("php")).toBe(true);
    expect(loaded.has("ruby")).toBe(true);
    expect(loaded.has("csharp")).toBe(true);
    expect(loaded.has("lua")).toBe(true);
    expect(loaded.has("perl")).toBe(true);
    expect(loaded.has("scala")).toBe(true);
  });
});
