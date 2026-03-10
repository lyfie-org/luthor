import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import { SimpleEditor } from "./SimpleEditor";

export const simpleEditorPreset: EditorPreset = {
  id: "simple-editor",
  label: "Simple Editor",
  description: "Lightweight editor with constrained formatting and send controls.",
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
    Editor: SimpleEditor,
  },
  toolbar: [],
  config: createPresetEditorConfig("simple-editor", "Type your message..."),
  css: "simple-editor/styles.css",
};

