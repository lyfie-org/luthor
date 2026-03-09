import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import { ComposerEditor } from "./ComposerEditor";

export const composerPreset: EditorPreset = {
  id: "composer",
  label: "Simple Text Input",
  description: "Message composer with constrained formatting and send controls.",
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
    Editor: ComposerEditor,
  },
  toolbar: [],
  config: createPresetEditorConfig("composer", "Type your message..."),
  css: "composer/styles.css",
};

