export const EXTENSIVE_DEMO_MARKDOWN = `# Luthor Full Extension Showcase

This demo document is intentionally dense so you can validate every extension in one pass.

## 1) Text + Inline Formatting

Use this line to test **bold**, *italic*, ++underline++, ~~strikethrough~~, and \`inline code\`.

Link example: [Luthor repository](https://github.com/lyfie/luthor)

Subscript and superscript examples:
- H<sub>2</sub>O for subscript
- x<sup>2</sup> + y<sup>2</sup> for superscript

Typography controls to test manually on selected text:
- Font family: Inter / Merriweather / JetBrains Mono
- Font size: 12px through 32px
- Line height: 1.0 through 2.0
- Text color + highlight swatches

## 2) Block Structure + Layout

### Heading Level 3 Sample

> Blockquote sample for block formatting and readability checks.

- Bulleted list item A
- Bulleted list item B

1. Numbered list item one
2. Numbered list item two

- [x] Checklist item complete
- [ ] Checklist item pending

---

## 3) Table Operations

| Feature | Status | Notes |
| --- | --- | --- |
| Insert row/column | ✅ | Test above, below, left, right |
| Header toggle | ✅ | Enable/disable first-row headers |
| Merge/unmerge | ✅ | Select adjacent cells |
| Delete actions | ✅ | Delete row, column, or full table |

## 4) Code + Intelligence

\`\`\`ts
type FeatureStatus = {
  name: string;
  ready: boolean;
};

const features: FeatureStatus[] = [
  { name: "code", ready: true },
  { name: "codeIntelligence", ready: true },
  { name: "codeFormat", ready: true },
];

export function enabledCount(input: FeatureStatus[]): number {
  return input.filter((entry) => entry.ready).length;
}
\`\`\`

Use Tab / Shift+Tab to validate indentation behavior in and out of code blocks.

## 5) Media Blocks

### Image (preset visible)

![Default filler image](https://picsum.photos/1200/640)

### Iframe Embed (preset visible)

\`\`\`html-embed
<figure>
  <iframe
    src="https://player.vimeo.com/video/76979871"
    width="720"
    height="405"
    title="Default iframe embed"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</figure>
\`\`\`

### YouTube Embed (preset visible)

\`\`\`html-embed
<figure>
  <iframe
    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    width="720"
    height="405"
    title="Default YouTube embed"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</figure>
\`\`\`

### HTML Embed (preset visible)

\`\`\`html-embed
<section>
  <h3>HTML Embed Preview</h3>
  <p>This block is loaded through the html-embed markdown transformer.</p>
</section>
\`\`\`

## 6) Workflow + Productivity

- Undo / redo history
- Floating toolbar on text selection
- Right-click context menu
- Draggable block handle
- Slash command menu (type "/")
- Command palette (Ctrl+Shift+P)
- Enter key behavior and tab indentation

## 7) Import / Export + Custom Node

- Switch between Visual / HTML / Markdown tabs to verify round-trips.
- Insert a custom feature card from toolbar or command palette.

Default filler paragraph:
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
`;

export const CATEGORY_BY_EXTENSION: Record<string, string> = {
  bold: "Text",
  italic: "Text",
  underline: "Text",
  strikethrough: "Text",
  subscript: "Text",
  superscript: "Text",
  link: "Text",
  fontFamily: "Typography",
  fontSize: "Typography",
  lineHeight: "Typography",
  textColor: "Typography",
  textHighlight: "Typography",
  blockFormat: "Structure",
  list: "Structure",
  table: "Structure",
  horizontalRule: "Structure",
  code: "Code",
  codeFormat: "Code",
  codeIntelligence: "Code",
  tabIndent: "Workflow",
  enterKeyBehavior: "Workflow",
  history: "Workflow",
  commandPalette: "Workflow",
  slashCommand: "Workflow",
  contextMenu: "Workflow",
  draggableBlock: "Workflow",
  floatingToolbar: "Workflow",
  image: "Media",
  htmlEmbed: "Media",
  iframeEmbed: "Media",
  youTubeEmbed: "Media",
  markdown: "Import / Export",
  html: "Import / Export",
  featureCard: "Custom",
};

export const CATEGORY_ORDER = [
  "Text",
  "Typography",
  "Structure",
  "Code",
  "Media",
  "Workflow",
  "Import / Export",
  "Custom",
  "Other",
] as const;

export const SHOWCASE_HIGHLIGHTS = [
  "Visual + HTML + Markdown mode switching",
  "Command palette, slash menu, and context menu workflows",
  "Media tooling: image, iframe, YouTube, and HTML embeds",
  "Formatting depth: text, structure, code, and custom cards",
];
