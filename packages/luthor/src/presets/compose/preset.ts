import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import { ComposeEditor } from "./ComposeEditor";

export const composePreset: EditorPreset = {
  id: "compose",
  label: "Compose Editor",
  description: "Focused rich text drafting preset with a compact, practical toolbar.",
  extensions: createExtensiveExtensions({
    featureFlags: {
      image: false,
      table: false,
      iframeEmbed: false,
      youTubeEmbed: false,
      emoji: true,
      commandPalette: false,
      slashCommand: false,
      draggableBlock: false,
      customNode: false,
    },
  }),
  components: {
    Editor: ComposeEditor,
  },
  toolbar: ["bold", "italic", "underline", "strikethrough", "link", "unorderedList", "orderedList", "checkList", "undo", "redo"],
  config: createPresetEditorConfig("compose", "Write your draft..."),
  css: "compose/styles.css",
};
