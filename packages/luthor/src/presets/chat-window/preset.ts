import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import { ChatWindowEditor } from "./ChatWindowEditor";

export const chatWindowPreset: EditorPreset = {
  id: "chat-window",
  label: "Chat Window",
  description: "Chat composer with action row and send controls.",
  extensions: createExtensiveExtensions({
    featureFlags: {
      bold: true,
      italic: true,
      underline: false,
      strikethrough: true,
      table: false,
      image: false,
      blockFormat: false,
      code: false,
      codeIntelligence: false,
      codeFormat: false,
      list: false,
      iframeEmbed: false,
      youTubeEmbed: false,
      commandPalette: false,
      slashCommand: false,
      draggableBlock: false,
      customNode: false,
      history: false,
    },
  }),
  components: {
    Editor: ChatWindowEditor,
  },
  toolbar: [],
  config: createPresetEditorConfig("chat-window", "Write a message..."),
  css: "chat-window/styles.css",
};
