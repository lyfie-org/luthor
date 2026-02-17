import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const minimalPreset: EditorPreset = {
  id: "minimal",
  label: "Minimal",
  description: "Lightweight editor for short text and embeds.",
  toolbar: ["bold", "italic", "link"],
  config: createPresetEditorConfig("minimal", "Write something..."),
  css: "minimal/styles.css",
};
