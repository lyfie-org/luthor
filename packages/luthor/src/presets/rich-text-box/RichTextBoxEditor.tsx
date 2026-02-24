import { forwardRef } from "react";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
  type FeatureFlagOverrides,
} from "../extensive";

const RICH_TEXT_BOX_DEFAULT_FLAGS: FeatureFlagOverrides = {
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

export type RichTextBoxEditorProps = Omit<ExtensiveEditorProps, "featureFlags"> & {
  featureFlags?: FeatureFlagOverrides;
  compactToolbar?: boolean;
};

export const RichTextBoxEditor = forwardRef<ExtensiveEditorRef, RichTextBoxEditorProps>(
  (
    { className, variantClassName, compactToolbar = false, toolbarClassName, featureFlags, ...props },
    ref,
  ) => {
    return (
      <ExtensiveEditor
        ref={ref}
        {...props}
        className={["luthor-preset-rich-text-box", className].filter(Boolean).join(" ")}
        variantClassName={[
          compactToolbar ? "luthor-preset-rich-text-box--compact" : "",
          variantClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        toolbarClassName={[
          compactToolbar ? "luthor-preset-rich-text-box__toolbar--compact" : "",
          toolbarClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        featureFlags={{ ...RICH_TEXT_BOX_DEFAULT_FLAGS, ...(featureFlags ?? {}) }}
      />
    );
  },
);

RichTextBoxEditor.displayName = "RichTextBoxEditor";
