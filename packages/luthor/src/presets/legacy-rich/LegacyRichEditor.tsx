/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { forwardRef } from "react";
import type { ToolbarLayout } from "../../core";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
  type FeatureFlag,
  type FeatureFlagOverrides,
} from "../extensive";
import { PresetFeaturePolicy, joinClassNames } from "../_shared";

export const LEGACY_RICH_MARKDOWN_MODES = ["visual-only", "visual", "json", "markdown"] as const;
export const LEGACY_RICH_HTML_MODES = ["visual-only", "visual", "json", "html"] as const;
export const LEGACY_RICH_DUAL_SOURCE_MODES = ["visual-only", "visual", "markdown", "html"] as const;

export type LegacyRichSourceFormat = "markdown" | "html" | "both";
export type LegacyRichEditorMode =
  | (typeof LEGACY_RICH_MARKDOWN_MODES)[number]
  | (typeof LEGACY_RICH_HTML_MODES)[number]
  | (typeof LEGACY_RICH_DUAL_SOURCE_MODES)[number];

export const LEGACY_RICH_DEFAULT_FEATURE_FLAGS: FeatureFlagOverrides = {
  bold: true,
  italic: true,
  underline: false,
  strikethrough: true,
  fontFamily: false,
  fontSize: false,
  lineHeight: false,
  textColor: false,
  textHighlight: false,
  subscript: false,
  superscript: false,
  link: true,
  horizontalRule: true,
  table: true,
  list: true,
  history: true,
  image: true,
  blockFormat: true,
  code: true,
  codeIntelligence: true,
  codeFormat: true,
  tabIndent: true,
  enterKeyBehavior: true,
  iframeEmbed: false,
  youTubeEmbed: false,
  floatingToolbar: false,
  contextMenu: false,
  commandPalette: false,
  slashCommand: false,
  emoji: false,
  draggableBlock: false,
  customNode: false,
  themeToggle: true,
};

const LEGACY_RICH_ENFORCED_FEATURE_FLAGS: FeatureFlagOverrides = {
  tabIndent: true,
  draggableBlock: false,
  iframeEmbed: false,
  youTubeEmbed: false,
  customNode: false,
  emoji: false,
  commandPalette: false,
  slashCommand: false,
};

const LEGACY_RICH_FEATURE_POLICY = new PresetFeaturePolicy<FeatureFlag>(
  LEGACY_RICH_DEFAULT_FEATURE_FLAGS,
  LEGACY_RICH_ENFORCED_FEATURE_FLAGS,
);

export const LEGACY_RICH_TOOLBAR_LAYOUT: ToolbarLayout = {
  sections: [
    {
      items: ["undo", "redo"],
    },
    {
      items: ["blockFormat", "quote", "alignLeft", "alignCenter", "alignRight", "alignJustify"],
    },
    {
      items: ["bold", "italic", "strikethrough", "code", "link"],
    },
    {
      items: ["unorderedList", "orderedList", "checkList", "indentList", "outdentList"],
    },
    {
      items: ["codeBlock", "horizontalRule", "table", "image"],
    },
    {
      items: ["themeToggle"],
    },
  ],
};

function resolveLegacyRichModes(sourceFormat: LegacyRichSourceFormat): readonly LegacyRichEditorMode[] {
  if (sourceFormat === "both") {
    return LEGACY_RICH_DUAL_SOURCE_MODES;
  }

  return sourceFormat === "html"
    ? LEGACY_RICH_HTML_MODES
    : LEGACY_RICH_MARKDOWN_MODES;
}

export type LegacyRichEditorProps = Omit<
  ExtensiveEditorProps,
  | "featureFlags"
  | "availableModes"
  | "initialMode"
  | "defaultEditorView"
  | "sourceMetadataMode"
  | "isListStyleDropdownEnabled"
> & {
  sourceFormat?: LegacyRichSourceFormat;
  initialMode?: LegacyRichEditorMode;
  defaultEditorView?: LegacyRichEditorMode;
  featureFlags?: FeatureFlagOverrides;
};

export const LegacyRichEditor = forwardRef<ExtensiveEditorRef, LegacyRichEditorProps>(
  (
    {
      className,
      variantClassName,
      toolbarClassName,
      toolbarLayout,
      sourceFormat = "both",
      initialMode = "visual",
      defaultEditorView,
      featureFlags,
      ...props
    },
    ref,
  ) => {
    const availableModes = resolveLegacyRichModes(sourceFormat);
    const requestedInitialMode = defaultEditorView ?? initialMode;
    const resolvedInitialMode = availableModes.includes(requestedInitialMode)
      ? requestedInitialMode
      : "visual";

    return (
      <ExtensiveEditor
        ref={ref}
        {...props}
        className={joinClassNames("luthor-preset-legacy-rich", className)}
        variantClassName={joinClassNames(
          "luthor-preset-legacy-rich__variant",
          variantClassName,
        )}
        toolbarClassName={joinClassNames(
          "luthor-preset-legacy-rich__toolbar",
          toolbarClassName,
        )}
        availableModes={availableModes}
        initialMode={resolvedInitialMode}
        sourceMetadataMode="none"
        isListStyleDropdownEnabled={false}
        toolbarLayout={toolbarLayout ?? LEGACY_RICH_TOOLBAR_LAYOUT}
        featureFlags={LEGACY_RICH_FEATURE_POLICY.resolve(featureFlags)}
      />
    );
  },
);

LegacyRichEditor.displayName = "LegacyRichEditor";
