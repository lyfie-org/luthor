import { CodeIntelligenceExtension } from "./CodeIntelligenceExtension";

describe("CodeIntelligenceExtension language options", () => {
  it("returns default language options when no override is provided", () => {
    const extension = new CodeIntelligenceExtension();
    const options = extension.getLanguageOptionsSnapshot();

    expect(options).toContain("plain");
    expect(options).toContain("typescript");
    expect(options).not.toContain("yaml");
  });

  it("appends custom language options and normalizes aliases", () => {
    const extension = new CodeIntelligenceExtension().configure({
      languageOptions: {
        mode: "append",
        values: ["md", "SQL"],
      },
    }) as CodeIntelligenceExtension;

    const options = extension.getLanguageOptionsSnapshot();

    expect(options).toContain("markdown");
    expect(options).toContain("sql");
  });

  it("replaces defaults when mode is replace", () => {
    const extension = new CodeIntelligenceExtension().configure({
      languageOptions: {
        mode: "replace",
        values: ["typescript", "js", "sql"],
      },
    }) as CodeIntelligenceExtension;

    const options = extension.getLanguageOptionsSnapshot();

    expect(options).toEqual(["js", "sql", "typescript"]);
    expect(options).not.toContain("plain");
  });

  it("throws for duplicate normalized options", () => {
    const extension = new CodeIntelligenceExtension().configure({
      languageOptions: {
        mode: "replace",
        values: ["js", "javascript"],
      },
    }) as CodeIntelligenceExtension;

    expect(() => extension.getLanguageOptionsSnapshot()).toThrow(/Duplicate language option/);
  });

  it("throws for invalid options", () => {
    const extension = new CodeIntelligenceExtension().configure({
      languageOptions: {
        mode: "replace",
        values: ["auto"],
      },
    }) as CodeIntelligenceExtension;

    expect(() => extension.getLanguageOptionsSnapshot()).toThrow(/Invalid language option/);
  });

  it("uses plain fallback theme for plaintext-like languages", () => {
    const extension = new CodeIntelligenceExtension() as CodeIntelligenceExtension & {
      getThemeForLanguage?: (language: string | null | undefined) => string | null;
    };

    expect(extension.getThemeForLanguage?.("plaintext")).toBe("plain");
    expect(extension.getThemeForLanguage?.("plain")).toBe("plain");
    expect(extension.getThemeForLanguage?.(null)).toBe("plain");
  });

  it("uses hljs theme for non-plaintext selected languages", () => {
    const extension = new CodeIntelligenceExtension() as CodeIntelligenceExtension & {
      getThemeForLanguage?: (language: string | null | undefined) => string | null;
    };

    expect(extension.getThemeForLanguage?.("typescript")).toBe("hljs");
    expect(extension.getThemeForLanguage?.("javascript")).toBe("hljs");
    expect(extension.getThemeForLanguage?.("tsx")).toBe("plain");
  });
});
