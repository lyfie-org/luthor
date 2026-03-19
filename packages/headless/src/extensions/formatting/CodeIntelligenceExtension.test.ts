import { getCodeLanguages, normalizeCodeLang } from "@lyfie/luthor-headless/vendor/lexicalCode";
import type { Transformer } from "@lexical/markdown";
import type { LexicalEditor } from "lexical";
import {
  CodeIntelligenceExtension,
  __TEST_ONLY_CODE_INTELLIGENCE_INTERNALS,
} from "./CodeIntelligenceExtension";
import { describe, expect, it, vi } from "vitest";
import { isKnownCodeLanguage } from "./codeLanguageSupport";

describe("CodeIntelligenceExtension language options", () => {
  it("returns default language options when no override is provided", () => {
    const extension = new CodeIntelligenceExtension();
    const options = extension.getLanguageOptionsSnapshot();
    const supported = new Set(
      getCodeLanguages()
        .map((id) => normalizeCodeLang(id.trim().toLowerCase()))
        .filter((id): id is string => Boolean(id)),
    );

    expect(options).toContain("plain");
    expect(options).toContain("typescript");
    expect(options).toContain("bash");
    expect(options).toContain("yaml");
    options.forEach((option) => {
      expect(supported.has(option) || isKnownCodeLanguage(option)).toBe(true);
    });
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

    expect(options).toEqual(["javascript", "sql", "typescript"]);
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

  it("uses full language labels for canonical and alias identifiers", () => {
    const { getLanguageDisplayLabel } = __TEST_ONLY_CODE_INTELLIGENCE_INTERNALS;

    expect(getLanguageDisplayLabel("js")).toBe("JavaScript");
    expect(getLanguageDisplayLabel("javascript")).toBe("JavaScript");
    expect(getLanguageDisplayLabel("py")).toBe("Python");
    expect(getLanguageDisplayLabel("ts")).toBe("TypeScript");
    expect(getLanguageDisplayLabel("text")).toBe("Plain Text");
    expect(getLanguageDisplayLabel("txt")).toBe("Plain Text");
    expect(getLanguageDisplayLabel("plain")).toBe("Plain Text");
    expect(getLanguageDisplayLabel("bash")).toBe("Bash");
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
    expect(extension.getThemeForLanguage?.("tsx")).toBe("hljs");
  });

  it("does not update code block language when the editor is non-editable", () => {
    const extension = new CodeIntelligenceExtension();
    const update = vi.fn();
    const editor = {
      isEditable: () => false,
      update,
    } as unknown as LexicalEditor;

    extension.setCodeBlockLanguage(editor, "node-key", "typescript");

    expect(update).not.toHaveBeenCalled();
  });

  it("queues code block language updates when the editor is editable", () => {
    const extension = new CodeIntelligenceExtension();
    const update = vi.fn();
    const editor = {
      isEditable: () => true,
      update,
    } as unknown as LexicalEditor;

    extension.setCodeBlockLanguage(editor, "node-key", "typescript");

    expect(update).toHaveBeenCalledTimes(1);
  });

  it("filters markdown shortcut transformers missing node dependencies", () => {
    class LinkNodeMock {}
    class CodeNodeMock {}

    const linkTransformer = {
      dependencies: [LinkNodeMock],
    } as unknown as Transformer;
    const codeTransformer = {
      dependencies: [CodeNodeMock],
    } as unknown as Transformer;
    const dependencyFreeTransformer = {} as Transformer;

    const editor = {
      hasNodes: (dependencies: readonly unknown[]) => {
        return dependencies.every((dependency) => dependency !== LinkNodeMock);
      },
    } as unknown as LexicalEditor;

    const { resolveSupportedMarkdownTransformers } =
      __TEST_ONLY_CODE_INTELLIGENCE_INTERNALS;

    const supported = resolveSupportedMarkdownTransformers(editor, [
      linkTransformer,
      codeTransformer,
      dependencyFreeTransformer,
    ]);

    expect(supported).toEqual([codeTransformer, dependencyFreeTransformer]);
  });
});
