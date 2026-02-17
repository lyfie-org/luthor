import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const chatPreset: EditorPreset = {
  id: "chat",
  label: "Chat",
  description: "Compact composer with mentions and quick formatting.",
  toolbar: ["bold", "italic", "link", "emoji", "mention"],
  config: createPresetEditorConfig("chat", "Write a message..."),
  css: "chat/styles.css",
};
