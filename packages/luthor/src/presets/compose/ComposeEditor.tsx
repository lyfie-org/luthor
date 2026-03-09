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
  showRecipients?: boolean;
  showTo?: boolean;
  showCc?: boolean;
  showBcc?: boolean;
  showSubject?: boolean;
};

export const ComposeEditor = forwardRef<ExtensiveEditorRef, ComposeEditorProps>(
  (
    {
      className,
      variantClassName,
      compactToolbar = false,
      toolbarClassName,
      featureFlags,
      showRecipients = false,
      showTo = false,
      showCc = false,
      showBcc = false,
      showSubject = false,
      ...props
    },
    ref,
  ) => {
    const resolvedShowTo = showRecipients || showTo;
    const resolvedShowSubject = showRecipients || showSubject;
    const shouldShowRecipients = resolvedShowTo || showCc || showBcc || resolvedShowSubject;

    return (
      <div className={["luthor-preset-compose", className].filter(Boolean).join(" ")}>
        {shouldShowRecipients && (
          <div className="luthor-compose-shell">
            {resolvedShowTo && (
              <label className="luthor-compose-row" data-testid="compose-row-to">
                <span>To</span>
                <input type="text" readOnly value="" />
              </label>
            )}
            {showCc && (
              <label className="luthor-compose-row" data-testid="compose-row-cc">
                <span>Cc</span>
                <input type="text" readOnly value="" />
              </label>
            )}
            {showBcc && (
              <label className="luthor-compose-row" data-testid="compose-row-bcc">
                <span>Bcc</span>
                <input type="text" readOnly value="" />
              </label>
            )}
            {resolvedShowSubject && (
              <label className="luthor-compose-row" data-testid="compose-row-subject">
                <span>Subject</span>
                <input type="text" readOnly value="" />
              </label>
            )}
          </div>
        )}
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
          featureFlags={{ ...COMPOSE_DEFAULT_FLAGS, ...(featureFlags ?? {}) }}
        />
      </div>
    );
  },
);

ComposeEditor.displayName = "ComposeEditor";
