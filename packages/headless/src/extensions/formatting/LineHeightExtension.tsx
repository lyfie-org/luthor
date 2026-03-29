/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  $getSelection,
  $isTextNode,
  $isElementNode,
  $isRangeSelection,
  type ElementNode,
  LexicalEditor,
  type RangeSelection,
} from "lexical";
import {
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory, type BaseExtensionConfig } from "../types";

export type LineHeightOption = {
  value: string;
  label: string;
  lineHeight: string;
};

export interface LineHeightConfig extends BaseExtensionConfig {
  options: readonly LineHeightOption[];
  defaultLineHeight: string;
}

export type LineHeightCommands = {
  setLineHeight: (lineHeightValue: string) => void;
  clearLineHeight: () => void;
  getCurrentLineHeight: () => Promise<string | null>;
  getLineHeightOptions: () => readonly LineHeightOption[];
};

export type LineHeightStateQueries = {
  hasCustomLineHeight: () => Promise<boolean>;
};

const DEFAULT_LINE_HEIGHT_OPTIONS: readonly LineHeightOption[] = [
  { value: "default", label: "Default", lineHeight: "normal" },
  { value: "1", label: "1.0", lineHeight: "1" },
  { value: "1.15", label: "1.15", lineHeight: "1.15" },
  { value: "1.5", label: "1.5", lineHeight: "1.5" },
  { value: "1.75", label: "1.75", lineHeight: "1.75" },
  { value: "2", label: "2.0", lineHeight: "2" },
];

const DEFAULT_LINE_HEIGHT_OPTION: LineHeightOption = {
  value: "default",
  label: "Default",
  lineHeight: "1.5",
};
const MIN_LINE_HEIGHT_RATIO = 1;

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function isValidLineHeightOptionValue(value: string): boolean {
  const normalized = normalizeToken(value);
  if (normalized === "default") {
    return true;
  }

  return parseLineHeightRatio(value) !== null;
}

function parseLineHeightRatio(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d*\.?\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < MIN_LINE_HEIGHT_RATIO) {
    return null;
  }

  return parsed.toString();
}

function sanitizeLineHeightOptions(
  options: readonly LineHeightOption[],
  defaultLineHeight: string,
): readonly LineHeightOption[] {
  const seenValues = new Set<string>();
  const sanitized: LineHeightOption[] = [];

  for (const option of options) {
    const value = option.value.trim();
    const label = option.label.trim();
    const normalizedValue = normalizeToken(value);

    if (!value || !label) {
      continue;
    }

    if (!isValidLineHeightOptionValue(value)) {
      continue;
    }

    if (seenValues.has(normalizedValue)) {
      continue;
    }

    if (normalizedValue === "default") {
      seenValues.add(normalizedValue);
      sanitized.push({
        value,
        label,
        lineHeight: defaultLineHeight,
      });
      continue;
    }

    const ratio = parseLineHeightRatio(String(option.lineHeight));
    if (!ratio) {
      continue;
    }

    seenValues.add(normalizedValue);
    sanitized.push({
      value,
      label,
      lineHeight: ratio,
    });
  }

  if (sanitized.length === 0) {
    return DEFAULT_LINE_HEIGHT_OPTIONS;
  }

  const hasDefaultOption = sanitized.some((option) => {
    return normalizeToken(option.value) === "default";
  });

  if (!hasDefaultOption) {
    return [{ ...DEFAULT_LINE_HEIGHT_OPTION, lineHeight: defaultLineHeight }, ...sanitized];
  }

  return sanitized;
}

function sanitizeDefaultLineHeight(value: string): string {
  const ratio = parseLineHeightRatio(value);
  return ratio ?? DEFAULT_LINE_HEIGHT_OPTION.lineHeight;
}

export class LineHeightExtension extends BaseExtension<
  "lineHeight",
  LineHeightConfig,
  LineHeightCommands,
  LineHeightStateQueries
> {
  constructor() {
    super("lineHeight", [ExtensionCategory.Toolbar]);
    this.config = {
      options: DEFAULT_LINE_HEIGHT_OPTIONS,
      defaultLineHeight: DEFAULT_LINE_HEIGHT_OPTION.lineHeight,
      showInToolbar: true,
      category: [ExtensionCategory.Toolbar],
    };
  }

  register(): () => void {
    return () => {};
  }

  configure(config: Partial<LineHeightConfig>) {
    const nextConfig: Partial<LineHeightConfig> = { ...config };
    const defaultLineHeight = sanitizeDefaultLineHeight(
      String(config.defaultLineHeight ?? this.config.defaultLineHeight),
    );
    nextConfig.defaultLineHeight = defaultLineHeight;

    if (config.options) {
      nextConfig.options = sanitizeLineHeightOptions(config.options, defaultLineHeight);
    }

    return super.configure(nextConfig);
  }

  getCommands(editor: LexicalEditor): LineHeightCommands {
    return {
      setLineHeight: (lineHeightValue: string) => {
        const option = this.findOption(lineHeightValue);
        if (!option) return;
        this.applyLineHeight(editor, option.lineHeight);
      },
      clearLineHeight: () => {
        this.applyLineHeight(editor, "");
      },
      getCurrentLineHeight: () => Promise.resolve(this.getCurrentLineHeightValue(editor)),
      getLineHeightOptions: () => this.config.options,
    };
  }

  getStateQueries(editor: LexicalEditor): LineHeightStateQueries {
    return {
      hasCustomLineHeight: () => Promise.resolve(this.hasCustomLineHeight(editor)),
    };
  }

  private applyLineHeight(editor: LexicalEditor, lineHeight: string) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const selectedBlocks = this.getSelectedTopLevelBlocks(selection);
      for (const block of selectedBlocks) {
        const nextStyle = this.withStyleProperty(
          block.getStyle(),
          "line-height",
          lineHeight,
        );
        block.setStyle(nextStyle);

        // Enforce block-uniform line-height by writing the same value to all
        // text nodes in the block, regardless of partial selection.
        for (const node of block.getAllTextNodes()) {
          if (!$isTextNode(node)) {
            continue;
          }
          node.setStyle(this.withStyleProperty(node.getStyle(), "line-height", lineHeight));
        }
      }
    });
  }

  private getSelectedTopLevelBlocks(selection: RangeSelection): ElementNode[] {
    const blocks = new Map<string, ElementNode>();

    for (const node of selection.getNodes()) {
      const topLevel = node.getTopLevelElement();
      if (!topLevel || !$isElementNode(topLevel)) {
        continue;
      }

      if (topLevel.getType() === "root") {
        continue;
      }

      blocks.set(topLevel.getKey(), topLevel);
    }

    return [...blocks.values()];
  }

  private withStyleProperty(
    style: string,
    property: string,
    value: string,
  ): string {
    const propertyMatcher = new RegExp(`^${property}\\s*:`, "i");
    const declarations = style
      .split(";")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .filter((entry) => !propertyMatcher.test(entry));

    const nextValue = value.trim();
    if (nextValue.length > 0) {
      declarations.push(`${property}: ${nextValue}`);
    }

    return declarations.join("; ");
  }

  private hasCustomLineHeight(editor: LexicalEditor): boolean {
    let hasCustomLineHeight = false;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const blockLineHeight = this.getSelectedBlocksLineHeight(selection);
      if (blockLineHeight === "mixed") {
        hasCustomLineHeight = true;
        return;
      }
      const current = blockLineHeight ?? $getSelectionStyleValueForProperty(selection, "line-height", "");
      const normalized = this.normalizeValue(current);
      hasCustomLineHeight = normalized.length > 0 && normalized !== "normal";
    });

    return hasCustomLineHeight;
  }

  private getCurrentLineHeightValue(editor: LexicalEditor): string | null {
    let currentValue: string | null = null;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const blockLineHeight = this.getSelectedBlocksLineHeight(selection);
      if (blockLineHeight === "mixed") {
        currentValue = null;
        return;
      }
      const current = blockLineHeight ?? $getSelectionStyleValueForProperty(selection, "line-height", "");
      const normalizedCurrent = this.normalizeValue(current);

      if (!normalizedCurrent || normalizedCurrent === "normal") {
        currentValue = "default";
        return;
      }
      if (normalizedCurrent === this.normalizeValue(this.config.defaultLineHeight)) {
        currentValue = "default";
        return;
      }

      const matched = this.config.options.find((option) => {
        if (this.normalizeValue(option.value) === normalizedCurrent) {
          return true;
        }
        return this.normalizeValue(option.lineHeight) === normalizedCurrent;
      });

      currentValue = matched?.value ?? null;
    });

    return currentValue;
  }

  private getSelectedBlocksLineHeight(selection: RangeSelection): string | "mixed" | null {
    const selectedBlocks = this.getSelectedTopLevelBlocks(selection);
    if (selectedBlocks.length === 0) {
      return null;
    }

    let firstNormalized: string | null = null;
    let firstValue = "";

    for (const block of selectedBlocks) {
      const currentValue = this.readStyleProperty(block.getStyle(), "line-height");
      const normalizedCurrent = this.normalizeValue(currentValue);

      if (firstNormalized === null) {
        firstNormalized = normalizedCurrent;
        firstValue = currentValue;
        continue;
      }

      if (firstNormalized !== normalizedCurrent) {
        return "mixed";
      }
    }

    return firstValue;
  }

  private findOption(value: string): LineHeightOption | undefined {
    const normalizedValue = this.normalizeValue(value);
    return this.config.options.find((option) => {
      return this.normalizeValue(option.value) === normalizedValue;
    });
  }

  private normalizeValue(value: string): string {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
    const ratio = parseLineHeightRatio(normalized);
    return ratio ?? normalized;
  }

  private readStyleProperty(style: string, property: string): string {
    const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = style.match(new RegExp(`(?:^|;)\\s*${escapedProperty}\\s*:\\s*([^;]+)`, "i"));
    return match?.[1]?.trim() ?? "";
  }
}

export const lineHeightExtension = new LineHeightExtension();
