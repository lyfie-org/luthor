import type { SlashCommandVisibility } from "../../core";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type FeatureFlagOverrides,
} from "../extensive";

const NOTION_DEFAULT_FLAGS: FeatureFlagOverrides = {
  slashCommand: true,
  draggableBlock: true,
  commandPalette: true,
  floatingToolbar: false,
  contextMenu: false,
};

export type NotionLikeEditorProps = Omit<
  ExtensiveEditorProps,
  "featureFlags" | "isToolbarEnabled"
> & {
  slashVisibility?: SlashCommandVisibility;
  isDraggableEnabled?: boolean;
  featureFlags?: FeatureFlagOverrides;
  isToolbarEnabled?: boolean;
};

export function NotionLikeEditor({
  className,
  variantClassName,
  slashVisibility,
  isDraggableEnabled = true,
  featureFlags,
  isToolbarEnabled = false,
  ...props
}: NotionLikeEditorProps) {
  return (
    <ExtensiveEditor
      {...props}
      className={["luthor-preset-notion-like", className].filter(Boolean).join(" ")}
      variantClassName={["luthor-preset-notion-like__variant", variantClassName]
        .filter(Boolean)
        .join(" ")}
      isToolbarEnabled={isToolbarEnabled}
      slashCommandVisibility={slashVisibility}
      featureFlags={{
        ...NOTION_DEFAULT_FLAGS,
        draggableBlock: isDraggableEnabled,
        ...(featureFlags ?? {}),
      }}
    />
  );
}
