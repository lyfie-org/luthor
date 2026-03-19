import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import {
  MarkDownEditor,
  MD_EDITOR_DEFAULT_FEATURE_FLAGS,
} from "./MarkDownEditor";

export const mdEditorPreset: EditorPreset = {
  id: "md-editor",
  label: "MD Editor",
  description: "Markdown-native feature set with visual, JSON, and MD source views.",
  extensions: createExtensiveExtensions({
    featureFlags: MD_EDITOR_DEFAULT_FEATURE_FLAGS,
  }),
  components: {
    Editor: MarkDownEditor,
  },
  toolbar: [
    "undo",
    "redo",
    "blockFormat",
    "quote",
    "alignLeft",
    "alignCenter",
    "alignRight",
    "alignJustify",
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
    "table",
    "image",
  ],
  config: createPresetEditorConfig("md-editor", "Write markdown..."),
  css: "md-editor/styles.css",
};

