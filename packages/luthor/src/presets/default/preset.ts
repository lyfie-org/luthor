import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const defaultPreset: EditorPreset = {
  id: "default",
  label: "Default",
  description: "Balanced general purpose editor preset.",
  toolbar: ["heading", "bold", "italic", "link", "image", "table"],
  config: createPresetEditorConfig("default", "Start writing..."),
  css: "default/styles.css",
};
