import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory, type BaseExtensionConfig } from "../types";

export type FontFamilyOption = {
  value: string;
  label: string;
  fontFamily: string;
  cssImportUrl?: string;
};

export type FontCssLoadStrategy = "none" | "preload-all" | "on-demand";

export interface FontFamilyConfig extends BaseExtensionConfig {
  options: readonly FontFamilyOption[];
  cssLoadStrategy: FontCssLoadStrategy;
}

export type FontFamilyCommands = {
  setFontFamily: (fontValue: string) => void;
  clearFontFamily: () => void;
  getCurrentFontFamily: () => Promise<string | null>;
  getFontFamilyOptions: () => readonly FontFamilyOption[];
};

export type FontFamilyStateQueries = {
  hasCustomFontFamily: () => Promise<boolean>;
};

const DEFAULT_FONT_OPTIONS: readonly FontFamilyOption[] = [
  { value: "default", label: "Default", fontFamily: "inherit" },
  { value: "sans", label: "Sans", fontFamily: "Arial, Helvetica, sans-serif" },
  { value: "serif", label: "Serif", fontFamily: "Georgia, 'Times New Roman', serif" },
  { value: "mono", label: "Mono", fontFamily: "'Courier New', Courier, monospace" },
];

const DEFAULT_FONT_OPTION: FontFamilyOption = {
  value: "default",
  label: "Default",
  fontFamily: "inherit",
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function isValidOptionToken(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(value);
}

function sanitizeFontFamilyOptions(
  options: readonly FontFamilyOption[],
): readonly FontFamilyOption[] {
  const seenValues = new Set<string>();
  const sanitized: FontFamilyOption[] = [];

  for (const option of options) {
    const value = option.value.trim();
    const label = option.label.trim();
    const fontFamily = option.fontFamily.trim();

    if (!value || !label || !fontFamily) {
      continue;
    }

    if (!isValidOptionToken(value)) {
      continue;
    }

    const normalizedValue = normalizeToken(value);
    if (seenValues.has(normalizedValue)) {
      continue;
    }

    seenValues.add(normalizedValue);
    sanitized.push({
      value,
      label,
      fontFamily,
      cssImportUrl: option.cssImportUrl?.trim() || undefined,
    });
  }

  if (sanitized.length === 0) {
    return DEFAULT_FONT_OPTIONS;
  }

  const hasDefaultOption = sanitized.some((option) => {
    return normalizeToken(option.value) === "default";
  });

  if (!hasDefaultOption) {
    return [DEFAULT_FONT_OPTION, ...sanitized];
  }

  return sanitized;
}

/**
 * FontFamilyExtension provides controlled font-family styling for text selections.
 *
 * Fonts are only applied from a configured whitelist (`config.options`).
 * Optional CSS font loading can be configured via `cssLoadStrategy`:
 * - "none": do not load external CSS
 * - "preload-all": load all option `cssImportUrl` values on register
 * - "on-demand": load a font's `cssImportUrl` when it is first selected
 */
export class FontFamilyExtension extends BaseExtension<
  "fontFamily",
  FontFamilyConfig,
  FontFamilyCommands,
  FontFamilyStateQueries
> {
  private readonly loadedFontUrls = new Set<string>();

  constructor() {
    super("fontFamily", [ExtensionCategory.Toolbar]);
    this.config = {
      options: DEFAULT_FONT_OPTIONS,
      cssLoadStrategy: "none",
      showInToolbar: true,
      category: [ExtensionCategory.Toolbar],
    };
  }

  register(): () => void {
    if (this.config.cssLoadStrategy === "preload-all") {
      for (const option of this.config.options) {
        this.ensureFontCssLoaded(option);
      }
    }

    return () => {};
  }

  configure(config: Partial<FontFamilyConfig>) {
    const nextConfig: Partial<FontFamilyConfig> = { ...config };

    if (config.options) {
      nextConfig.options = sanitizeFontFamilyOptions(config.options);
    }

    return super.configure(nextConfig);
  }

  getCommands(editor: LexicalEditor): FontFamilyCommands {
    return {
      setFontFamily: (fontValue: string) => {
        const option = this.findOption(fontValue);
        if (!option) return;

        this.ensureFontCssLoaded(option);
        this.applyFontFamily(editor, option.fontFamily);
      },
      clearFontFamily: () => {
        this.applyFontFamily(editor, "");
      },
      getCurrentFontFamily: () => Promise.resolve(this.getCurrentFontFamilyValue(editor)),
      getFontFamilyOptions: () => this.config.options,
    };
  }

  getStateQueries(editor: LexicalEditor): FontFamilyStateQueries {
    return {
      hasCustomFontFamily: () => Promise.resolve(this.hasCustomFontFamily(editor)),
    };
  }

  private applyFontFamily(editor: LexicalEditor, fontFamily: string) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      $patchStyleText(selection, {
        "font-family": fontFamily,
      });
    });
  }

  private hasCustomFontFamily(editor: LexicalEditor): boolean {
    let hasCustomFont = false;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const current = $getSelectionStyleValueForProperty(
        selection,
        "font-family",
        "",
      );

      hasCustomFont = this.normalizeFontValue(current).length > 0;
    });

    return hasCustomFont;
  }

  private getCurrentFontFamilyValue(editor: LexicalEditor): string | null {
    let currentValue: string | null = null;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const current = $getSelectionStyleValueForProperty(
        selection,
        "font-family",
        "",
      );

      if (!current) {
        currentValue = "default";
        return;
      }

      const normalizedCurrent = this.normalizeFontValue(current);
      const matched = this.config.options.find((option) => {
        if (this.normalizeFontValue(option.value) === normalizedCurrent) {
          return true;
        }
        return this.normalizeFontValue(option.fontFamily) === normalizedCurrent;
      });

      currentValue = matched?.value ?? null;
    });

    return currentValue;
  }

  private findOption(value: string): FontFamilyOption | undefined {
    const normalizedValue = this.normalizeFontValue(value);
    return this.config.options.find((option) => {
      return this.normalizeFontValue(option.value) === normalizedValue;
    });
  }

  private normalizeFontValue(fontValue: string): string {
    if (!fontValue) return "";
    const primaryFamily = fontValue.split(",")[0] ?? "";
    return primaryFamily.replace(/['"]/g, "").trim().toLowerCase();
  }

  private ensureFontCssLoaded(option: FontFamilyOption) {
    if (this.config.cssLoadStrategy === "none") return;
    if (!option.cssImportUrl) return;
    if (typeof document === "undefined") return;

    const url = option.cssImportUrl;
    const urlId = encodeURIComponent(url);

    if (this.loadedFontUrls.has(url)) return;

    const existing = document.querySelector(
      `link[data-luthor-font-url="${urlId}"]`,
    );
    if (existing) {
      this.loadedFontUrls.add(url);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute("data-luthor-font-url", urlId);
    document.head.appendChild(link);

    this.loadedFontUrls.add(url);
  }
}

export const fontFamilyExtension = new FontFamilyExtension();
