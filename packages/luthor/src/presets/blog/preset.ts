import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const blogPreset: EditorPreset = {
  id: "blog",
  label: "Blog",
  description: "Long form publishing with media and quotes.",
  toolbar: [
    "heading",
    "bold",
    "italic",
    "link",
    "image",
    "blockquote",
    "bulletedList",
    "numberedList",
  ],
  config: createPresetEditorConfig("blog", "Tell your story..."),
  css: "blog/styles.css",
};
