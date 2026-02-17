import type { EditorPreset } from "..";

export const emailPreset: EditorPreset = {
  id: "email",
  label: "Email",
  description: "Email safe markup with stricter rules.",
  toolbar: ["bold", "italic", "link", "button", "table"],
  config: {
    placeholder: "Write an email...",
  },
  css: "email/styles.css",
};
