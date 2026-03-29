/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { SlashCommandVisibility } from "../../core";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type FeatureFlag,
  type FeatureFlagOverrides,
} from "../extensive";
import { PresetFeaturePolicy, joinClassNames } from "../_shared";

export const SLASH_EDITOR_DEFAULT_MODES = ["visual-only", "visual", "json", "markdown", "html"] as const;

const SLASH_EDITOR_DEFAULT_FLAGS: FeatureFlagOverrides = {
  bold: true,
  italic: true,
  underline: true,
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
  table: true,
  list: true,
  history: true,
  image: false,
  blockFormat: true,
  code: true,
  codeIntelligence: true,
  codeFormat: true,
  tabIndent: true,
  enterKeyBehavior: true,
  iframeEmbed: false,
  youTubeEmbed: false,
  slashCommand: true,
  draggableBlock: true,
  commandPalette: false,
  floatingToolbar: false,
  contextMenu: false,
  emoji: false,
  customNode: false,
  themeToggle: false,
};

const SLASH_EDITOR_ENFORCED_FEATURE_FLAGS: FeatureFlagOverrides = {
  slashCommand: true,
  commandPalette: false,
};

const SLASH_EDITOR_FEATURE_POLICY = new PresetFeaturePolicy<FeatureFlag>(
  SLASH_EDITOR_DEFAULT_FLAGS,
  SLASH_EDITOR_ENFORCED_FEATURE_FLAGS,
);

export const SLASH_EDITOR_COMMAND_ALLOWLIST = [
  "format.bold",
  "format.italic",
  "format.underline",
  "format.strikethrough",
  "format.code",
  "block.paragraph",
  "block.heading1",
  "block.heading2",
  "block.heading3",
  "block.heading4",
  "block.heading5",
  "block.heading6",
  "block.quote",
  "block.codeblock",
  "list.bullet",
  "list.numbered",
  "list.check",
  "link.insert",
  "insert.horizontal-rule",
  "insert.table",
] as const;

const SLASH_EDITOR_DEFAULT_VISIBILITY: SlashCommandVisibility = {
  allowlist: SLASH_EDITOR_COMMAND_ALLOWLIST,
};

export type SlashEditorProps = Omit<
  ExtensiveEditorProps,
  "featureFlags" | "isToolbarEnabled"
> & {
  slashVisibility?: SlashCommandVisibility;
  isDraggableEnabled?: boolean;
  featureFlags?: FeatureFlagOverrides;
  isToolbarEnabled?: boolean;
};

export function SlashEditor({
  className,
  variantClassName,
  slashVisibility,
  isDraggableEnabled = true,
  featureFlags,
  isToolbarEnabled = false,
  ...props
}: SlashEditorProps) {
  const resolvedFeatureFlags = {
    ...SLASH_EDITOR_FEATURE_POLICY.resolve(featureFlags),
    draggableBlock: isDraggableEnabled,
  };

  return (
    <ExtensiveEditor
      {...props}
      className={joinClassNames("luthor-preset-slash-editor", className)}
      variantClassName={joinClassNames(
        "luthor-preset-slash-editor__variant",
        variantClassName,
      )}
      availableModes={SLASH_EDITOR_DEFAULT_MODES}
      isToolbarEnabled={isToolbarEnabled}
      slashCommandVisibility={slashVisibility ?? SLASH_EDITOR_DEFAULT_VISIBILITY}
      featureFlags={resolvedFeatureFlags}
    />
  );
}
