import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { slashEditorPreset } from "../slash-editor";

export const notionLikePreset: EditorPreset = {
  ...slashEditorPreset,
  id: "notion-like",
  config: createPresetEditorConfig("notion-like", "Type '/' for commands..."),
  css: "slash-editor/styles.css",
};
