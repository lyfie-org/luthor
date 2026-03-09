import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import { NotionLikeEditor } from "./NotionLikeEditor";

export const notionLikePreset: EditorPreset = {
  id: "notion-like",
  label: "Slash Editor",
  description: "Slash-first writing with draggable block defaults.",
  extensions: createExtensiveExtensions({
    featureFlags: {
      slashCommand: true,
      draggableBlock: true,
      floatingToolbar: false,
      contextMenu: false,
    },
  }),
  components: {
    Editor: NotionLikeEditor,
  },
  toolbar: [],
  config: createPresetEditorConfig("notion-like", "Type '/' for commands..."),
  css: "notion-like/styles.css",
};
