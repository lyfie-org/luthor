import { forwardRef } from "react";
import type { LegacyRichEditorProps, LegacyRichEditorMode } from "../legacy-rich";
import {
  LegacyRichEditor,
  LEGACY_RICH_DEFAULT_FEATURE_FLAGS,
  LEGACY_RICH_TOOLBAR_LAYOUT,
} from "../legacy-rich";
import type { ExtensiveEditorRef } from "../extensive";

export const MD_EDITOR_DEFAULT_MODES = ["visual", "json", "markdown"] as const;
export const MD_EDITOR_DEFAULT_FEATURE_FLAGS = LEGACY_RICH_DEFAULT_FEATURE_FLAGS;
export const MD_EDITOR_TOOLBAR_LAYOUT = LEGACY_RICH_TOOLBAR_LAYOUT;

export type MDEditorMode = Exclude<LegacyRichEditorMode, "html">;
export type MDEditorView = MDEditorMode;

export type MDEditorProps = Omit<
  LegacyRichEditorProps,
  "sourceFormat" | "initialMode" | "defaultEditorView"
> & {
  initialMode?: MDEditorMode;
  defaultEditorView?: MDEditorView;
};

export const MDEditor = forwardRef<ExtensiveEditorRef, MDEditorProps>(
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
        className={["luthor-preset-md-editor", className].filter(Boolean).join(" ")}
        variantClassName={["luthor-preset-md-editor__variant", variantClassName]
          .filter(Boolean)
          .join(" ")}
        toolbarClassName={["luthor-preset-md-editor__toolbar", toolbarClassName]
          .filter(Boolean)
          .join(" ")}
        sourceFormat="markdown"
        initialMode={initialMode}
        defaultEditorView={defaultEditorView}
        toolbarLayout={toolbarLayout ?? MD_EDITOR_TOOLBAR_LAYOUT}
      />
    );
  },
);

MDEditor.displayName = "MDEditor";
