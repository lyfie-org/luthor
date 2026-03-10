import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import {
  SlashEditor,
  SLASH_EDITOR_COMMAND_ALLOWLIST,
} from "./SlashEditor";

export const slashEditorPreset: EditorPreset = {
  id: "slash-editor",
  label: "Slash Editor",
  description: "Slash-first editing with curated commands and draggable block support.",
  extensions: createExtensiveExtensions({
    featureFlags: {
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
      codeIntelligence: false,
      codeFormat: true,
      tabIndent: true,
      enterKeyBehavior: true,
      iframeEmbed: false,
      youTubeEmbed: false,
      slashCommand: true,
      draggableBlock: true,
      floatingToolbar: false,
      contextMenu: false,
      commandPalette: false,
      emoji: false,
      customNode: false,
      themeToggle: false,
    },
  }),
  components: {
    Editor: SlashEditor,
  },
  toolbar: [...SLASH_EDITOR_COMMAND_ALLOWLIST],
  config: createPresetEditorConfig("slash-editor", "Type '/' for commands..."),
  css: "slash-editor/styles.css",
};
