import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../../core/preset-config";
import { createExtensiveExtensions } from "../extensive";
import { MDFriendlyEditor } from "./MDFriendlyEditor";

export const mdFriendlyPreset: EditorPreset = {
  id: "md-friendly",
  label: "MD Editor",
  description: "Visual and markdown editing with conversion bridge.",
  extensions: createExtensiveExtensions({
    featureFlags: {
      table: false,
      image: false,
      iframeEmbed: false,
      youTubeEmbed: false,
      customNode: false,
    },
  }),
  components: {
    Editor: MDFriendlyEditor,
  },
  toolbar: ["bold", "italic", "underline", "strikethrough", "link", "unorderedList", "orderedList"],
  config: createPresetEditorConfig("md-friendly", "Write markdown..."),
  css: "md-friendly/styles.css",
};

