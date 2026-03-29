/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

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
  codeIntelligence: true,
};

export const MD_EDITOR_TOOLBAR_LAYOUT: ToolbarLayout = LEGACY_RICH_TOOLBAR_LAYOUT;

export type MarkDownEditorMode = Exclude<LegacyRichEditorMode, "html">;
export type MarkDownEditorView = MarkDownEditorMode;

export type MarkDownEditorProps = Omit<
  LegacyRichEditorProps,
  "sourceFormat" | "initialMode" | "defaultEditorView"
> & {
  initialMode?: MarkDownEditorMode;
  defaultEditorView?: MarkDownEditorView;
};

export const MarkDownEditor = forwardRef<ExtensiveEditorRef, MarkDownEditorProps>(
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

MarkDownEditor.displayName = "MarkDownEditor";
