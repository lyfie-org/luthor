import { forwardRef } from "react";
import type { ToolbarLayout } from "../../core";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
  type FeatureFlagOverrides,
} from "../extensive";

export const LEGACY_RICH_MARKDOWN_MODES = ["visual", "json", "markdown"] as const;
export const LEGACY_RICH_HTML_MODES = ["visual", "json", "html"] as const;

export type LegacyRichSourceFormat = "markdown" | "html";
export type LegacyRichEditorMode =
  | (typeof LEGACY_RICH_MARKDOWN_MODES)[number]
  | (typeof LEGACY_RICH_HTML_MODES)[number];

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
  table: false,
  list: true,
  history: true,
  image: false,
  blockFormat: true,
  code: true,
  codeIntelligence: false,
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
  themeToggle: false,
};

export const LEGACY_RICH_TOOLBAR_LAYOUT: ToolbarLayout = {
  sections: [
    {
      items: ["undo", "redo"],
    },
    {
      items: ["blockFormat", "quote"],
    },
    {
      items: ["bold", "italic", "strikethrough", "code", "link"],
    },
    {
      items: ["unorderedList", "orderedList", "checkList", "indentList", "outdentList"],
    },
    {
      items: ["codeBlock", "horizontalRule"],
    },
  ],
};

function resolveLegacyRichModes(sourceFormat: LegacyRichSourceFormat): readonly LegacyRichEditorMode[] {
  return sourceFormat === "html"
    ? LEGACY_RICH_HTML_MODES
    : LEGACY_RICH_MARKDOWN_MODES;
}

export type LegacyRichEditorProps = Omit<
  ExtensiveEditorProps,
  "featureFlags" | "availableModes" | "initialMode" | "defaultEditorView"
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
      sourceFormat = "markdown",
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
        className={["luthor-preset-legacy-rich", className].filter(Boolean).join(" ")}
        variantClassName={["luthor-preset-legacy-rich__variant", variantClassName]
          .filter(Boolean)
          .join(" ")}
        toolbarClassName={["luthor-preset-legacy-rich__toolbar", toolbarClassName]
          .filter(Boolean)
          .join(" ")}
        availableModes={availableModes}
        initialMode={resolvedInitialMode}
        toolbarLayout={toolbarLayout ?? LEGACY_RICH_TOOLBAR_LAYOUT}
        featureFlags={{
          ...LEGACY_RICH_DEFAULT_FEATURE_FLAGS,
          ...(featureFlags ?? {}),
          draggableBlock: false,
          table: false,
          image: false,
          iframeEmbed: false,
          youTubeEmbed: false,
          customNode: false,
          emoji: false,
          commandPalette: false,
          slashCommand: false,
          themeToggle: false,
        }}
      />
    );
  },
);

LegacyRichEditor.displayName = "LegacyRichEditor";
