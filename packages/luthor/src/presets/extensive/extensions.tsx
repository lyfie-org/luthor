import {
  ALL_MARKDOWN_TRANSFORMERS,
  MarkdownExtension,
  TableExtension,
  HTMLEmbedExtension,
  ImageExtension,
  ContextMenuExtension,
  CommandPaletteExtension,
  DraggableBlockExtension,
  LinkExtension,
  createCustomNodeExtension,
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  fontFamilyExtension,
  horizontalRuleExtension,
  listExtension,
  historyExtension,
  blockFormatExtension,
  htmlExtension,
  codeExtension,
  codeIntelligenceExtension,
  codeFormatExtension,
  tabIndentExtension,
} from "@lyfie/luthor-headless";
import { createFloatingToolbarExtension, setFloatingToolbarContext } from "../../core";

export { setFloatingToolbarContext };

const markdownExt = new MarkdownExtension();
(markdownExt as any).config = {
  ...(markdownExt as any).config,
  customTransformers: ALL_MARKDOWN_TRANSFORMERS,
};

export const extensiveImageExtension = new ImageExtension();
(extensiveImageExtension as any).config = {
  ...(extensiveImageExtension as any).config,
  uploadHandler: async (file: File) => URL.createObjectURL(file),
  defaultAlignment: "center",
  resizable: true,
  pasteListener: { insert: true, replace: true },
  debug: false,
};

const tableExt = new TableExtension();
(tableExt as any).config = {
  ...(tableExt as any).config,
  enableContextMenu: true,
  markdownExtension: markdownExt,
};

const htmlEmbedExt = new HTMLEmbedExtension();
(htmlEmbedExt as any).config = {
  ...(htmlEmbedExt as any).config,
  markdownExtension: markdownExt,
};

const floatingToolbarExt = createFloatingToolbarExtension();

const contextMenuExt = new ContextMenuExtension();
(contextMenuExt as any).config = {
  ...(contextMenuExt as any).config,
  preventDefault: true,
};

const commandPaletteExt = new CommandPaletteExtension();

const draggableBlockExt = new DraggableBlockExtension();
(draggableBlockExt as any).config = {
  ...(draggableBlockExt as any).config,
  showMoveButtons: true,
  showUpButton: true,
  showDownButton: true,
  buttonStackPosition: "left",
};

const linkExt = new LinkExtension();
(linkExt as any).config = {
  ...(linkExt as any).config,
  linkSelectedTextOnPaste: true,
  autoLinkText: true,
  autoLinkUrls: true,
};

const fontFamilyExt = fontFamilyExtension.configure({
  options: [
    { value: "default", label: "Default", fontFamily: "inherit" },
    {
      value: "inter",
      label: "Inter",
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      cssImportUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    },
    {
      value: "merriweather",
      label: "Merriweather",
      fontFamily: "'Merriweather', Georgia, 'Times New Roman', serif",
      cssImportUrl:
        "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
    },
    {
      value: "jetbrains-mono",
      label: "JetBrains Mono",
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      cssImportUrl:
        "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
    },
  ],
  cssLoadStrategy: "on-demand",
});

const { extension: featureCardExtension } = createCustomNodeExtension({
  nodeType: "featureCard",
  defaultPayload: {
    title: "Headless Custom Node",
    description:
      "This block is rendered by createCustomNodeExtension from @lyfie/luthor-headless.",
    tag: "Custom",
  },
  render: ({ payload, isSelected }) => (
    <aside className={`luthor-extensive-feature-card${isSelected ? " is-selected" : ""}`}>
      <div className="luthor-extensive-feature-card__tag">{payload.tag ?? "Custom"}</div>
      <h4 className="luthor-extensive-feature-card__title">{payload.title ?? "Custom Node"}</h4>
      <p className="luthor-extensive-feature-card__description">
        {payload.description ?? "Insert strongly typed custom content blocks."}
      </p>
    </aside>
  ),
});

export const extensiveExtensions = [
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  fontFamilyExt,
  linkExt,
  horizontalRuleExtension,
  tableExt,
  listExtension,
  historyExtension,
  extensiveImageExtension,
  blockFormatExtension,
  htmlExtension,
  markdownExt,
  codeExtension,
  codeIntelligenceExtension,
  codeFormatExtension,
  tabIndentExtension,
  htmlEmbedExt,
  floatingToolbarExt,
  contextMenuExt,
  commandPaletteExt,
  draggableBlockExt,
  featureCardExtension,
] as const;

export type ExtensiveExtensions = typeof extensiveExtensions;
