import { getCodeLanguages } from "@lexical/code";
import { CodeIntelligenceExtension } from "@lyfie/luthor-headless/extensions/formatting/CodeIntelligenceExtension";
import {
  PRISM_LANGUAGE_PACK_IDS,
  ensurePrismLanguagePackLoaded,
} from "./prismLanguagePack";

describe("prismLanguagePack", () => {
  it("loads curated prism grammars into the lexical runtime", () => {
    ensurePrismLanguagePackLoaded();

    const runtimeLanguages = new Set(getCodeLanguages());
    PRISM_LANGUAGE_PACK_IDS.forEach((languageId) => {
      expect(runtimeLanguages.has(languageId)).toBe(true);
    });
    expect(runtimeLanguages.has("shell")).toBe(true);
    expect(runtimeLanguages.has("dockerfile")).toBe(true);
  });

  it("exposes curated languages in default code intelligence options", () => {
    ensurePrismLanguagePackLoaded();

    const extension = new CodeIntelligenceExtension();
    const options = extension.getLanguageOptionsSnapshot();

    expect(options).toEqual(
      expect.arrayContaining([
        "bash",
        "csharp",
        "docker",
        "go",
        "graphql",
        "ini",
        "json",
        "json5",
        "kotlin",
        "php",
        "ruby",
        "toml",
        "yaml",
      ]),
    );
  });

  it("normalizes common aliases to canonical option IDs when grammars are loaded", () => {
    ensurePrismLanguagePackLoaded();

    const extension = new CodeIntelligenceExtension().configure({
      languageOptions: {
        mode: "replace",
        values: ["shell", "dockerfile", "yml", "c#"],
      },
    }) as CodeIntelligenceExtension;

    expect(extension.getLanguageOptionsSnapshot()).toEqual([
      "bash",
      "csharp",
      "docker",
      "yaml",
    ]);
  });
});
