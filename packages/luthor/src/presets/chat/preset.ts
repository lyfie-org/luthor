import type { EditorPreset } from "..";

export const chatPreset: EditorPreset = {
  id: "chat",
  label: "Chat",
  description: "Compact composer with mentions and quick formatting.",
  toolbar: ["bold", "italic", "link", "emoji", "mention"],
  config: {
    placeholder: "Write a message...",
  },
  css: "chat/styles.css",
};
