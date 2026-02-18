import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory, type BaseExtensionConfig } from "../types";

export type TextColorOption = {
  value: string;
  label: string;
  color: string;
};

export interface TextColorConfig extends BaseExtensionConfig {
  options: readonly TextColorOption[];
}

export type TextColorCommands = {
  setTextColor: (colorValue: string) => void;
  clearTextColor: () => void;
  getCurrentTextColor: () => Promise<string | null>;
  getTextColorOptions: () => readonly TextColorOption[];
};

export type TextColorStateQueries = {
  hasCustomTextColor: () => Promise<boolean>;
};

const DEFAULT_TEXT_COLOR_OPTIONS: readonly TextColorOption[] = [
  { value: "default", label: "Default", color: "inherit" },
  { value: "black", label: "Black", color: "#111827" },
  { value: "slate", label: "Slate", color: "#334155" },
  { value: "red", label: "Red", color: "#dc2626" },
  { value: "orange", label: "Orange", color: "#ea580c" },
  { value: "green", label: "Green", color: "#16a34a" },
  { value: "blue", label: "Blue", color: "#2563eb" },
  { value: "purple", label: "Purple", color: "#7c3aed" },
];

export class TextColorExtension extends BaseExtension<
  "textColor",
  TextColorConfig,
  TextColorCommands,
  TextColorStateQueries
> {
  constructor() {
    super("textColor", [ExtensionCategory.Toolbar]);
    this.config = {
      options: DEFAULT_TEXT_COLOR_OPTIONS,
      showInToolbar: true,
      category: [ExtensionCategory.Toolbar],
    };
  }

  register(): () => void {
    return () => {};
  }

  getCommands(editor: LexicalEditor): TextColorCommands {
    return {
      setTextColor: (colorValue: string) => {
        const option = this.findOption(colorValue);
        if (option) {
          this.applyColor(editor, option.color);
          return;
        }

        if (this.isValidCssColor(colorValue)) {
          this.applyColor(editor, colorValue);
        }
      },
      clearTextColor: () => {
        this.applyColor(editor, "");
      },
      getCurrentTextColor: () => Promise.resolve(this.getCurrentTextColorValue(editor)),
      getTextColorOptions: () => this.config.options,
    };
  }

  getStateQueries(editor: LexicalEditor): TextColorStateQueries {
    return {
      hasCustomTextColor: () => Promise.resolve(this.hasCustomTextColor(editor)),
    };
  }

  private applyColor(editor: LexicalEditor, color: string) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      $patchStyleText(selection, {
        color,
      });
    });
  }

  private hasCustomTextColor(editor: LexicalEditor): boolean {
    let hasCustomColor = false;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const current = $getSelectionStyleValueForProperty(selection, "color", "");
      hasCustomColor = this.normalizeValue(current).length > 0;
    });

    return hasCustomColor;
  }

  private getCurrentTextColorValue(editor: LexicalEditor): string | null {
    let currentValue: string | null = null;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const current = $getSelectionStyleValueForProperty(selection, "color", "");
      if (!current) {
        currentValue = "default";
        return;
      }

      const normalizedCurrent = this.normalizeValue(current);
      const matched = this.config.options.find((option) => {
        if (this.normalizeValue(option.value) === normalizedCurrent) {
          return true;
        }
        return this.normalizeValue(option.color) === normalizedCurrent;
      });

      currentValue = matched?.value ?? current;
    });

    return currentValue;
  }

  private findOption(value: string): TextColorOption | undefined {
    const normalizedValue = this.normalizeValue(value);
    return this.config.options.find((option) => {
      return this.normalizeValue(option.value) === normalizedValue;
    });
  }

  private normalizeValue(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "");
  }

  private isValidCssColor(value: string): boolean {
    const candidate = value.trim();
    if (!candidate) return false;

    if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
      return CSS.supports("color", candidate);
    }

    return /^#([\da-f]{3}|[\da-f]{6})$/i.test(candidate);
  }
}

export const textColorExtension = new TextColorExtension();
