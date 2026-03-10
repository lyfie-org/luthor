import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import {
  LegacyRichEditor,
  LEGACY_RICH_DEFAULT_FEATURE_FLAGS,
} from "./LegacyRichEditor";

export const legacyRichPreset: EditorPreset = {
  id: "legacy-rich",
  label: "Legacy Rich Editor",
  description:
    "Metadata-free rich text profile for native markdown and html compatibility.",
  extensions: createExtensiveExtensions({
    featureFlags: LEGACY_RICH_DEFAULT_FEATURE_FLAGS,
  }),
  components: {
    Editor: LegacyRichEditor,
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
    "link",
    "unorderedList",
    "orderedList",
    "checkList",
    "indentList",
    "outdentList",
    "codeBlock",
    "horizontalRule",
  ],
  config: createPresetEditorConfig("legacy-rich", "Write metadata-free content..."),
};
