import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import {
  HeadlessEditorPreset,
  HEADLESS_EDITOR_DEFAULT_FEATURE_FLAGS,
} from "./HeadlessEditorPreset";

export const headlessEditorPreset: EditorPreset = {
  id: "headless-editor",
  label: "Headless Editor",
  description: "Headless-style rich editor with text toolbar pills and source tabs.",
  extensions: createExtensiveExtensions({
    featureFlags: HEADLESS_EDITOR_DEFAULT_FEATURE_FLAGS,
  }),
  components: {
    Editor: HeadlessEditorPreset,
  },
  toolbar: [
    "bold",
    "italic",
    "strikethrough",
    "code",
    "clearMarks",
    "clearNodes",
    "paragraph",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "unorderedList",
    "orderedList",
    "codeBlock",
    "quote",
    "horizontalRule",
    "hardBreak",
    "undo",
    "redo",
  ],
  config: createPresetEditorConfig("headless-editor", "Start writing..."),
  css: "headless-editor/styles.css",
};
