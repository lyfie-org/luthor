import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory, type BaseExtensionConfig } from "../types";

export type TextHighlightOption = {
  value: string;
  label: string;
  backgroundColor: string;
};

export interface TextHighlightConfig extends BaseExtensionConfig {
  options: readonly TextHighlightOption[];
}

export type TextHighlightCommands = {
  setTextHighlight: (highlightValue: string) => void;
  clearTextHighlight: () => void;
  getCurrentTextHighlight: () => Promise<string | null>;
  getTextHighlightOptions: () => readonly TextHighlightOption[];
};

export type TextHighlightStateQueries = {
  hasTextHighlight: () => Promise<boolean>;
};

const DEFAULT_TEXT_HIGHLIGHT_OPTIONS: readonly TextHighlightOption[] = [
  { value: "default", label: "Default", backgroundColor: "transparent" },
  { value: "yellow", label: "Yellow", backgroundColor: "#fef08a" },
  { value: "green", label: "Green", backgroundColor: "#bbf7d0" },
  { value: "blue", label: "Blue", backgroundColor: "#bfdbfe" },
  { value: "pink", label: "Pink", backgroundColor: "#fbcfe8" },
  { value: "orange", label: "Orange", backgroundColor: "#fed7aa" },
  { value: "purple", label: "Purple", backgroundColor: "#ddd6fe" },
];

export class TextHighlightExtension extends BaseExtension<
  "textHighlight",
  TextHighlightConfig,
  TextHighlightCommands,
  TextHighlightStateQueries
> {
  constructor() {
    super("textHighlight", [ExtensionCategory.Toolbar]);
    this.config = {
      options: DEFAULT_TEXT_HIGHLIGHT_OPTIONS,
      showInToolbar: true,
      category: [ExtensionCategory.Toolbar],
    };
  }

  register(): () => void {
    return () => {};
  }

  getCommands(editor: LexicalEditor): TextHighlightCommands {
    return {
      setTextHighlight: (highlightValue: string) => {
        const option = this.findOption(highlightValue);
        if (option) {
          this.applyHighlight(editor, option.backgroundColor);
          return;
        }

        if (this.isValidCssColor(highlightValue)) {
          this.applyHighlight(editor, highlightValue);
        }
      },
      clearTextHighlight: () => {
        this.applyHighlight(editor, "");
      },
      getCurrentTextHighlight: () => Promise.resolve(this.getCurrentTextHighlightValue(editor)),
      getTextHighlightOptions: () => this.config.options,
    };
  }

  getStateQueries(editor: LexicalEditor): TextHighlightStateQueries {
    return {
      hasTextHighlight: () => Promise.resolve(this.hasTextHighlight(editor)),
    };
  }

  private applyHighlight(editor: LexicalEditor, backgroundColor: string) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const hasHighlight = this.normalizeValue(backgroundColor).length > 0;

      $patchStyleText(selection, {
        "background-color": backgroundColor,
        "padding-left": hasHighlight ? "0.1em" : "",
        "padding-right": hasHighlight ? "0.1em" : "",
        "box-decoration-break": hasHighlight ? "clone" : "",
        "-webkit-box-decoration-break": hasHighlight ? "clone" : "",
      });
    });
  }

  private hasTextHighlight(editor: LexicalEditor): boolean {
    let hasHighlight = false;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const current = $getSelectionStyleValueForProperty(
        selection,
        "background-color",
        "",
      );
      const normalized = this.normalizeValue(current);
      hasHighlight = normalized.length > 0 && normalized !== "transparent";
    });

    return hasHighlight;
  }

  private getCurrentTextHighlightValue(editor: LexicalEditor): string | null {
    let currentValue: string | null = null;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const current = $getSelectionStyleValueForProperty(
        selection,
        "background-color",
        "",
      );
      const normalizedCurrent = this.normalizeValue(current);

      if (!normalizedCurrent || normalizedCurrent === "transparent") {
        currentValue = "default";
        return;
      }

      const matched = this.config.options.find((option) => {
        if (this.normalizeValue(option.value) === normalizedCurrent) {
          return true;
        }
        return (
          this.normalizeValue(option.backgroundColor) === normalizedCurrent
        );
      });

      currentValue = matched?.value ?? current;
    });

    return currentValue;
  }

  private findOption(value: string): TextHighlightOption | undefined {
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

export const textHighlightExtension = new TextHighlightExtension();
