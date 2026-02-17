import type { EditorPreset } from "..";

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
  config: {
    placeholder: "Tell your story...",
  },
  css: "blog/styles.css",
};
