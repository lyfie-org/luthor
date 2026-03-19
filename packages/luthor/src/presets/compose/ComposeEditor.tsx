import { forwardRef } from "react";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
  type FeatureFlag,
  type FeatureFlagOverrides,
} from "../extensive";
import { PresetFeaturePolicy, joinClassNames } from "../_shared";

const COMPOSE_DEFAULT_FLAGS: FeatureFlagOverrides = {
  bold: true,
  italic: true,
  underline: true,
  strikethrough: true,
  list: true,
  history: true,
  link: true,
  blockFormat: true,
  code: true,
  codeIntelligence: true,
  codeFormat: true,
  image: false,
  table: false,
  iframeEmbed: false,
  youTubeEmbed: false,
  emoji: false,
  floatingToolbar: false,
  contextMenu: false,
  commandPalette: false,
  slashCommand: false,
  draggableBlock: false,
  customNode: false,
};

const COMPOSE_FEATURE_POLICY = new PresetFeaturePolicy<FeatureFlag>(
  COMPOSE_DEFAULT_FLAGS,
);

export type ComposeEditorProps = Omit<ExtensiveEditorProps, "featureFlags"> & {
  featureFlags?: FeatureFlagOverrides;
  compactToolbar?: boolean;
};

export const ComposeEditor = forwardRef<ExtensiveEditorRef, ComposeEditorProps>(
  (
    {
      className,
      variantClassName,
      compactToolbar = false,
      toolbarClassName,
      featureFlags,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={joinClassNames("luthor-preset-compose", className)}>
        <ExtensiveEditor
          ref={ref}
          {...props}
          className="luthor-preset-compose__editor"
          variantClassName={joinClassNames(
            compactToolbar ? "luthor-preset-compose--compact" : undefined,
            "luthor-preset-compose__variant",
            variantClassName,
          )}
          toolbarClassName={joinClassNames(
            compactToolbar ? "luthor-preset-compose__toolbar--compact" : undefined,
            toolbarClassName,
          )}
          availableModes={["visual-only", "visual", "json"]}
          featureFlags={COMPOSE_FEATURE_POLICY.resolve(featureFlags)}
        />
      </div>
    );
  },
);

ComposeEditor.displayName = "ComposeEditor";
