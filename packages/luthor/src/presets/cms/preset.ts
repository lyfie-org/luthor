import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const cmsPreset: EditorPreset = {
  id: "cms",
  label: "CMS",
  description: "Structured content with validation and schema rules.",
  toolbar: ["heading", "bold", "italic", "link", "image"],
  config: createPresetEditorConfig("cms", "Compose structured content..."),
  css: "cms/styles.css",
};
