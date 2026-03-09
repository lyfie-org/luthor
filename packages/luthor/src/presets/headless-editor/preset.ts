import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { HeadlessEditorPreset } from "./HeadlessEditorPreset";

export const headlessEditorPreset: EditorPreset = {
  id: "headless-editor",
  label: "Headless Text Input",
  description: "Minimal preset for custom extension and UI composition.",
  components: {
    Editor: HeadlessEditorPreset,
  },
  toolbar: ["bold", "italic", "underline", "unorderedList", "undo", "redo"],
  config: createPresetEditorConfig("headless-editor", "Start writing..."),
  css: "headless-editor/styles.css",
};
