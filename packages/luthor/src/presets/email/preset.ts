import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const emailPreset: EditorPreset = {
  id: "email",
  label: "Email",
  description: "Email safe markup with stricter rules.",
  toolbar: ["bold", "italic", "link", "button", "table"],
  config: createPresetEditorConfig("email", "Write an email..."),
  css: "email/styles.css",
};
