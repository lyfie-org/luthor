import { forwardRef } from "react";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
  type FeatureFlagOverrides,
} from "../extensive";

const SIMPLE_TEXT_FEATURE_FLAGS: FeatureFlagOverrides = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  fontFamily: false,
  fontSize: false,
  lineHeight: false,
  textColor: false,
  textHighlight: false,
  subscript: false,
  superscript: false,
  link: false,
  horizontalRule: false,
  table: false,
  list: false,
  image: false,
  blockFormat: false,
  code: false,
  codeIntelligence: false,
  codeFormat: false,
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

export type SimpleTextEditorProps = Omit<
  ExtensiveEditorProps,
  "featureFlags" | "availableModes" | "initialMode" | "toolbarVisibility"
> & {
  hideToolbarByDefault?: boolean;
};

export const SimpleTextEditor = forwardRef<ExtensiveEditorRef, SimpleTextEditorProps>(
  (
    { className, variantClassName, hideToolbarByDefault = true, isToolbarEnabled, ...props },
    ref,
  ) => {
    return (
      <ExtensiveEditor
        ref={ref}
        {...props}
        className={["luthor-preset-simple-text", className].filter(Boolean).join(" ")}
        variantClassName={["luthor-preset-simple-text__variant", variantClassName]
          .filter(Boolean)
          .join(" ")}
        availableModes={["visual"]}
        initialMode="visual"
        isToolbarEnabled={hideToolbarByDefault ? false : isToolbarEnabled}
        featureFlags={SIMPLE_TEXT_FEATURE_FLAGS}
      />
    );
  },
);

SimpleTextEditor.displayName = "SimpleTextEditor";
