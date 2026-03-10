import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { mdEditorPreset } from "../md-editor";

export const mdFriendlyPreset: EditorPreset = {
  ...mdEditorPreset,
  id: "md-friendly",
  config: createPresetEditorConfig("md-friendly", "Write markdown..."),
  css: "md-editor/styles.css",
};
