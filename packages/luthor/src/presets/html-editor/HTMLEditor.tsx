import { forwardRef } from "react";
import type { LegacyRichEditorProps, LegacyRichEditorMode } from "../legacy-rich";
import {
  LegacyRichEditor,
  LEGACY_RICH_DEFAULT_FEATURE_FLAGS,
  LEGACY_RICH_TOOLBAR_LAYOUT,
} from "../legacy-rich";
import type { ExtensiveEditorRef } from "../extensive";

export const HTML_EDITOR_DEFAULT_MODES = ["visual", "json", "html"] as const;
export const HTML_EDITOR_DEFAULT_FEATURE_FLAGS = LEGACY_RICH_DEFAULT_FEATURE_FLAGS;
export const HTML_EDITOR_TOOLBAR_LAYOUT = LEGACY_RICH_TOOLBAR_LAYOUT;

export type HTMLEditorMode = Exclude<LegacyRichEditorMode, "markdown">;

export type HTMLEditorProps = Omit<
  LegacyRichEditorProps,
  "sourceFormat" | "initialMode" | "defaultEditorView"
> & {
  initialMode?: HTMLEditorMode;
  defaultEditorView?: HTMLEditorMode;
};

export const HTMLEditor = forwardRef<ExtensiveEditorRef, HTMLEditorProps>(
  (
    {
      className,
      variantClassName,
      toolbarClassName,
      toolbarLayout,
      initialMode = "visual",
      defaultEditorView,
      ...props
    },
    ref,
  ) => {
    return (
      <LegacyRichEditor
        ref={ref}
        {...props}
        className={["luthor-preset-html-editor", className].filter(Boolean).join(" ")}
        variantClassName={["luthor-preset-html-editor__variant", variantClassName]
          .filter(Boolean)
          .join(" ")}
        toolbarClassName={["luthor-preset-html-editor__toolbar", toolbarClassName]
          .filter(Boolean)
          .join(" ")}
        sourceFormat="html"
        initialMode={initialMode}
        defaultEditorView={defaultEditorView}
        toolbarLayout={toolbarLayout ?? HTML_EDITOR_TOOLBAR_LAYOUT}
      />
    );
  },
);

HTMLEditor.displayName = "HTMLEditor";
