import { forwardRef } from "react";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
  type FeatureFlagOverrides,
} from "../extensive";

const COMPOSE_DEFAULT_FLAGS: FeatureFlagOverrides = {
  bold: true,
  italic: true,
  underline: true,
  strikethrough: true,
  list: true,
  history: true,
  link: true,
  blockFormat: true,
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
      <div className={["luthor-preset-compose", className].filter(Boolean).join(" ")}>
        <ExtensiveEditor
          ref={ref}
          {...props}
          className="luthor-preset-compose__editor"
          variantClassName={[
            compactToolbar ? "luthor-preset-compose--compact" : "",
            "luthor-preset-compose__variant",
            variantClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          toolbarClassName={[
            compactToolbar ? "luthor-preset-compose__toolbar--compact" : "",
            toolbarClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          availableModes={["visual", "json"]}
          featureFlags={{ ...COMPOSE_DEFAULT_FLAGS, ...(featureFlags ?? {}) }}
        />
      </div>
    );
  },
);

ComposeEditor.displayName = "ComposeEditor";
