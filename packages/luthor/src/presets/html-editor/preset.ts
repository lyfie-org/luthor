import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import { HTMLEditor, HTML_EDITOR_DEFAULT_FEATURE_FLAGS } from "./HTMLEditor";

export const htmlEditorPreset: EditorPreset = {
  id: "html-editor",
  label: "HTML Editor",
  description: "HTML-focused preset with visual, JSON, and HTML source views.",
  extensions: createExtensiveExtensions({
    featureFlags: HTML_EDITOR_DEFAULT_FEATURE_FLAGS,
  }),
  components: {
    Editor: HTMLEditor,
  },
  toolbar: [
    "undo",
    "redo",
    "blockFormat",
    "quote",
    "bold",
    "italic",
    "strikethrough",
    "code",
    "codeBlock",
    "link",
    "unorderedList",
    "orderedList",
    "checkList",
    "horizontalRule",
  ],
  config: createPresetEditorConfig("html-editor", "Write HTML-compatible content..."),
  css: "html-editor/styles.css",
};
