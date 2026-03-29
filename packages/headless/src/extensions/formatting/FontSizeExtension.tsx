/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory, type BaseExtensionConfig } from "../types";

export type FontSizeOption = {
  value: string;
  label: string;
  fontSize: string;
};

export interface FontSizeConfig extends BaseExtensionConfig {
  options: readonly FontSizeOption[];
}

export type FontSizeCommands = {
  setFontSize: (fontSizeValue: string) => void;
  clearFontSize: () => void;
  getCurrentFontSize: () => Promise<string | null>;
  getFontSizeOptions: () => readonly FontSizeOption[];
};

export type FontSizeStateQueries = {
  hasCustomFontSize: () => Promise<boolean>;
};

const DEFAULT_FONT_SIZE_OPTIONS: readonly FontSizeOption[] = [
  { value: "default", label: "Default", fontSize: "inherit" },
  { value: "12", label: "12px", fontSize: "12px" },
  { value: "14", label: "14px", fontSize: "14px" },
  { value: "16", label: "16px", fontSize: "16px" },
  { value: "18", label: "18px", fontSize: "18px" },
  { value: "20", label: "20px", fontSize: "20px" },
  { value: "24", label: "24px", fontSize: "24px" },
  { value: "32", label: "32px", fontSize: "32px" },
];

const DEFAULT_FONT_SIZE_OPTION: FontSizeOption = {
  value: "default",
  label: "Default",
  fontSize: "inherit",
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function isValidOptionToken(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(value);
}

function sanitizeFontSizeOptions(
  options: readonly FontSizeOption[],
): readonly FontSizeOption[] {
  const seenValues = new Set<string>();
  const sanitized: FontSizeOption[] = [];

  for (const option of options) {
    const value = String(option.value).trim();
    const label = String(option.label).trim();
    const fontSize = String(option.fontSize).trim();

    if (!value || !label || !fontSize) {
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
      fontSize,
    });
  }

  if (sanitized.length === 0) {
    return DEFAULT_FONT_SIZE_OPTIONS;
  }

  const hasDefaultOption = sanitized.some((option) => {
    return normalizeToken(option.value) === "default";
  });

  if (!hasDefaultOption) {
    return [DEFAULT_FONT_SIZE_OPTION, ...sanitized];
  }

  return sanitized;
}

export class FontSizeExtension extends BaseExtension<
  "fontSize",
  FontSizeConfig,
  FontSizeCommands,
  FontSizeStateQueries
> {
  constructor() {
    super("fontSize", [ExtensionCategory.Toolbar]);
    this.config = {
      options: DEFAULT_FONT_SIZE_OPTIONS,
      showInToolbar: true,
      category: [ExtensionCategory.Toolbar],
    };
  }

  register(): () => void {
    return () => {};
  }

  configure(config: Partial<FontSizeConfig>) {
    const nextConfig: Partial<FontSizeConfig> = { ...config };

    if (config.options) {
      nextConfig.options = sanitizeFontSizeOptions(config.options);
    }

    return super.configure(nextConfig);
  }

  getCommands(editor: LexicalEditor): FontSizeCommands {
    return {
      setFontSize: (fontSizeValue: string) => {
        const option = this.findOption(fontSizeValue);
        if (!option) return;
        this.applyFontSize(editor, option.fontSize);
      },
      clearFontSize: () => {
        this.applyFontSize(editor, "");
      },
      getCurrentFontSize: () => Promise.resolve(this.getCurrentFontSizeValue(editor)),
      getFontSizeOptions: () => this.config.options,
    };
  }

  getStateQueries(editor: LexicalEditor): FontSizeStateQueries {
    return {
      hasCustomFontSize: () => Promise.resolve(this.hasCustomFontSize(editor)),
    };
  }

  private applyFontSize(editor: LexicalEditor, fontSize: string) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      $patchStyleText(selection, {
        "font-size": fontSize,
      });
    });
  }

  private hasCustomFontSize(editor: LexicalEditor): boolean {
    let hasCustomSize = false;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const current = $getSelectionStyleValueForProperty(selection, "font-size", "");
      const normalized = this.normalizeValue(current);
      hasCustomSize = normalized.length > 0 && normalized !== "inherit";
    });

    return hasCustomSize;
  }

  private getCurrentFontSizeValue(editor: LexicalEditor): string | null {
    let currentValue: string | null = null;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const current = $getSelectionStyleValueForProperty(selection, "font-size", "");
      const normalizedCurrent = this.normalizeValue(current);

      if (!normalizedCurrent || normalizedCurrent === "inherit") {
        currentValue = "default";
        return;
      }

      const matched = this.config.options.find((option) => {
        if (this.normalizeValue(option.value) === normalizedCurrent) {
          return true;
        }
        return this.normalizeValue(option.fontSize) === normalizedCurrent;
      });

      currentValue = matched?.value ?? null;
    });

    return currentValue;
  }

  private findOption(value: string): FontSizeOption | undefined {
    const normalizedValue = this.normalizeValue(value);
    return this.config.options.find((option) => {
      return this.normalizeValue(option.value) === normalizedValue;
    });
  }

  private normalizeValue(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "");
  }
}

export const fontSizeExtension = new FontSizeExtension();
