import { forwardRef } from "react";
import type { ToolbarLayout } from "../../core";
import type { ExtensiveEditorRef, FeatureFlagOverrides } from "../extensive";
import type { LegacyRichEditorProps, LegacyRichEditorMode } from "../legacy-rich";
import {
  LegacyRichEditor,
  LEGACY_RICH_DEFAULT_FEATURE_FLAGS,
  LEGACY_RICH_TOOLBAR_LAYOUT,
} from "../legacy-rich";
import { joinClassNames } from "../_shared";

export const MD_EDITOR_DEFAULT_MODES = ["visual-only", "visual", "json", "markdown"] as const;
export const MD_EDITOR_DEFAULT_FEATURE_FLAGS: FeatureFlagOverrides = {
  ...LEGACY_RICH_DEFAULT_FEATURE_FLAGS,
};

export const MD_EDITOR_TOOLBAR_LAYOUT: ToolbarLayout = LEGACY_RICH_TOOLBAR_LAYOUT;

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
      featureFlags,
      ...props
    },
    ref,
  ) => {
    const resolvedFeatureFlags: FeatureFlagOverrides = {
      ...MD_EDITOR_DEFAULT_FEATURE_FLAGS,
      ...(featureFlags ?? {}),
    };

    return (
      <LegacyRichEditor
        ref={ref}
        {...props}
        className={joinClassNames("luthor-preset-md-editor", className)}
        variantClassName={joinClassNames(
          "luthor-preset-md-editor__variant",
          variantClassName,
        )}
        toolbarClassName={joinClassNames(
          "luthor-preset-md-editor__toolbar",
          toolbarClassName,
        )}
        sourceFormat="markdown"
        initialMode={initialMode}
        defaultEditorView={defaultEditorView}
        markdownBridgeFlavor="github"
        markdownSourceOfTruth
        featureFlags={resolvedFeatureFlags}
        toolbarLayout={toolbarLayout ?? MD_EDITOR_TOOLBAR_LAYOUT}
      />
    );
  },
);

MDEditor.displayName = "MDEditor";
