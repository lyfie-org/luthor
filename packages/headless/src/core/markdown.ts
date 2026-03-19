import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
  type ElementTransformer,
  type MultilineElementTransformer,
  type TextFormatTransformer,
  type Transformer,
} from "@lexical/markdown";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { QuoteNode, HeadingNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import {
  TableNode,
  TableRowNode,
  TableCellNode,
  $createTableNodeWithDimensions,
  $isTableNode,
  $isTableRowNode,
  $isTableCellNode,
} from "@lexical/table";
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import {
  $createParagraphNode,
  $createTextNode,
  createEditor,
  ParagraphNode,
  TextNode,
  LineBreakNode,
  TabNode,
  type EditorState,
  type ElementNode,
  type LexicalNode,
  IS_BOLD,
  IS_CODE,
  IS_HIGHLIGHT,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_UNDERLINE,
} from "lexical";
import {
  ImageNode,
  IframeEmbedNode,
  YouTubeEmbedNode,
  IMAGE_MARKDOWN_TRANSFORMER,
} from "@lyfie/luthor-headless/extensions/media";
import {
  appendMetadataEnvelopes,
  collectSupportedNodeMetadataPatches,
  extractMetadataEnvelopes,
  prepareDocumentForBridge,
  rehydrateDocumentFromEnvelopes,
  type JsonDocument,
  type MetadataEnvelope,
} from "./metadata-envelope";

export type { JsonDocument } from "./metadata-envelope";

export type SourceMetadataMode = "preserve" | "none";

export interface MarkdownBridgeOptions {
  metadataMode?: SourceMetadataMode;
}

const HORIZONTAL_RULE_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    if (!$isHorizontalRuleNode(node)) {
      return null;
    }

    return "---";
  },
  regExp: /^(?:---|___)\s*$/,
  replace: (
    parentNode: ElementNode,
    children: LexicalNode[],
    match: string[],
  ) => {
    void children;
    void match;
    parentNode.replace($createHorizontalRuleNode());
  },
  type: "element" as const,
};

const UNDERLINE_TRANSFORMER: TextFormatTransformer = {
  format: ["underline"] as const,
  tag: "++",
  type: "text-format",
};

function escapeMarkdownTitle(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function unescapeMarkdownTitle(value: string): string {
  return value.replace(/\\(["\\])/g, "$1");
}

function safeParseEmbedMeta(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

const IFRAME_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [IframeEmbedNode],
  export: (node: LexicalNode) => {
    if (!(node instanceof IframeEmbedNode)) {
      return null;
    }

    const payload = node.getPayload();
    const caption = payload.caption ?? "";
    const markdownTitle = caption ? ` "${escapeMarkdownTitle(caption)}"` : "";
    return `[iframe](${payload.src}${markdownTitle})`;
  },
  regExp:
    /^\[iframe\]\(([^)\s]+)(?:\s+"((?:[^"\\]|\\.)*)")?\)\s*(?:<!--\s*luthor:iframe\s+({[\s\S]*?})\s*-->)?\s*$/,
  replace: (
    parentNode: ElementNode,
    children: LexicalNode[],
    match: string[],
  ) => {
    void children;
    const [, src, captionValue, legacyMeta] = match;
    if (!src) {
      return;
    }

    const caption = typeof captionValue === "string"
      ? unescapeMarkdownTitle(captionValue)
      : "";
    let width = 640;
    let height = 360;
    let alignment: "left" | "center" | "right" = "center";
    let title: string | undefined;

    if (typeof legacyMeta === "string" && legacyMeta.length > 0) {
      const parsed = safeParseEmbedMeta(legacyMeta);
      if (parsed) {
        const parsedWidth = Number(parsed.width);
        if (Number.isFinite(parsedWidth)) {
          width = parsedWidth;
        }

        const parsedHeight = Number(parsed.height);
        if (Number.isFinite(parsedHeight)) {
          height = parsedHeight;
        }

        if (
          parsed.alignment === "left" ||
          parsed.alignment === "center" ||
          parsed.alignment === "right"
        ) {
          alignment = parsed.alignment;
        }

        if (typeof parsed.title === "string") {
          title = parsed.title;
        }
      }
    }

    parentNode.replace(
      new IframeEmbedNode({
        src,
        width,
        height,
        alignment,
        title,
        caption,
      }),
    );
  },
  type: "element" as const,
};

const YOUTUBE_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [YouTubeEmbedNode],
  export: (node: LexicalNode) => {
    if (!(node instanceof YouTubeEmbedNode)) {
      return null;
    }

    const payload = node.getPayload();
    const caption = payload.caption ?? "";
    const markdownTitle = caption ? ` "${escapeMarkdownTitle(caption)}"` : "";
    return `[youtube](${payload.src}${markdownTitle})`;
  },
  regExp:
    /^\[youtube\]\(([^)\s]+)(?:\s+"((?:[^"\\]|\\.)*)")?\)\s*(?:<!--\s*luthor:youtube\s+({[\s\S]*?})\s*-->)?\s*$/,
  replace: (
    parentNode: ElementNode,
    children: LexicalNode[],
    match: string[],
  ) => {
    void children;
    const [, src, captionValue, legacyMeta] = match;
    if (!src) {
      return;
    }

    const caption = typeof captionValue === "string"
      ? unescapeMarkdownTitle(captionValue)
      : "";
    let width = 640;
    let height = 360;
    let alignment: "left" | "center" | "right" = "center";
    let start = 0;

    if (typeof legacyMeta === "string" && legacyMeta.length > 0) {
      const parsed = safeParseEmbedMeta(legacyMeta);
      if (parsed) {
        const parsedWidth = Number(parsed.width);
        if (Number.isFinite(parsedWidth)) {
          width = parsedWidth;
        }

        const parsedHeight = Number(parsed.height);
        if (Number.isFinite(parsedHeight)) {
          height = parsedHeight;
        }

        if (
          parsed.alignment === "left" ||
          parsed.alignment === "center" ||
          parsed.alignment === "right"
        ) {
          alignment = parsed.alignment;
        }

        const parsedStart = Number(parsed.start);
        if (Number.isFinite(parsedStart)) {
          start = parsedStart;
        }
      }
    }

    parentNode.replace(
      new YouTubeEmbedNode({
        src,
        width,
        height,
        alignment,
        caption,
        start,
      }),
    );
  },
  type: "element" as const,
};

const TABLE_MARKDOWN_TRANSFORMER: MultilineElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const rows = node.getChildren();
    if (rows.length === 0) {
      return null;
    }

    const tableData: string[][] = [];
    rows.forEach((rowNode) => {
      if (!$isTableRowNode(rowNode)) {
        return;
      }

      const rowData: string[] = [];
      rowNode.getChildren().forEach((cellNode) => {
        if (!$isTableCellNode(cellNode)) {
          return;
        }

        rowData.push(cellNode.getTextContent().trim());
      });

      if (rowData.length > 0) {
        tableData.push(rowData);
      }
    });

    if (tableData.length === 0 || !tableData[0]) {
      return null;
    }

    const markdownLines: string[] = [];
    markdownLines.push(`| ${tableData[0].join(" | ")} |`);
    const columnCount = tableData[0].length || 1;
    markdownLines.push(`| ${Array(columnCount).fill("---").join(" | ")} |`);

    for (let rowIndex = 1; rowIndex < tableData.length; rowIndex += 1) {
      const row = tableData[rowIndex] ?? [];
      const padded = [...row];
      while (padded.length < columnCount) {
        padded.push("");
      }
      markdownLines.push(`| ${padded.join(" | ")} |`);
    }

    return markdownLines.join("\n");
  },
  regExpStart: /^\|.*\|$/,
  regExpEnd: {
    optional: true as const,
    regExp: /^$/,
  },
  replace: (
    rootNode: ElementNode,
    children: LexicalNode[] | null,
    startMatch: string[],
    endMatch: string[] | null,
    linesInBetween: string[] | null,
    isImport: boolean,
  ) => {
    void children;
    void endMatch;
    void isImport;

    const startLine = startMatch[0];
    if (!startLine) {
      return;
    }

    const allLines = [startLine, ...(linesInBetween ?? [])].filter(
      (line): line is string => typeof line === "string",
    );
    const tableLines = allLines.filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && trimmed.includes("|") && trimmed.split("|").length > 1;
    });

    if (tableLines.length < 2) {
      return;
    }

    const parsedRows: string[][] = [];
    tableLines.forEach((line) => {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.length > 0) {
        parsedRows.push(cells);
      }
    });

    if (parsedRows.length === 0 || !parsedRows[0]) {
      return;
    }

    const dataRows = parsedRows.filter(
      (row) => !row.every((cell) => /^:?-+:?$/.test(cell)),
    );
    if (dataRows.length === 0) {
      return;
    }

    const tableNode = $createTableNodeWithDimensions(
      dataRows.length,
      Math.max(...dataRows.map((row) => row.length)),
      false,
    );

    const tableRows = tableNode.getChildren();
    dataRows.forEach((rowData, rowIndex) => {
      const tableRow = tableRows[rowIndex];
      if (!$isTableRowNode(tableRow)) {
        return;
      }

      const cells = tableRow.getChildren();
      rowData.forEach((cellText, cellIndex) => {
        const cell = cells[cellIndex];
        if (!$isTableCellNode(cell)) {
          return;
        }

        cell.clear();
        const paragraph = $createParagraphNode();
        if (cellText) {
          paragraph.append($createTextNode(cellText));
        }
        cell.append(paragraph);
      });
    });

    rootNode.append(tableNode);
  },
  type: "multiline-element" as const,
};

const MARKDOWN_TRANSFORMERS: Transformer[] = [
  ...TRANSFORMERS,
  UNDERLINE_TRANSFORMER,
  HORIZONTAL_RULE_MARKDOWN_TRANSFORMER,
  TABLE_MARKDOWN_TRANSFORMER,
  IMAGE_MARKDOWN_TRANSFORMER,
  IFRAME_MARKDOWN_TRANSFORMER,
  YOUTUBE_MARKDOWN_TRANSFORMER,
];
const MARKDOWN_SUPPORTED_NODE_TYPES = new Set<string>([
  "root",
  "paragraph",
  "text",
  "linebreak",
  "tab",
  "heading",
  "quote",
  "list",
  "listitem",
  "link",
  "autolink",
  "code",
  "code-highlight",
  "horizontalrule",
  "image",
  "iframe-embed",
  "youtube-embed",
  "table",
  "tablerow",
  "tablecell",
]);

type JsonRecord = Record<string, unknown>;

const MARKDOWN_TEXT_NATIVE_FORMAT_MASK =
  IS_BOLD |
  IS_ITALIC |
  IS_STRIKETHROUGH |
  IS_CODE |
  IS_HIGHLIGHT |
  IS_UNDERLINE;

const MARKDOWN_NATIVE_KEYS: Readonly<Record<string, ReadonlySet<string>>> = {
  root: new Set(["type", "version", "children"]),
  paragraph: new Set(["type", "version", "children"]),
  text: new Set(["type", "version", "text", "format"]),
  linebreak: new Set(["type", "version"]),
  tab: new Set(["type", "version"]),
  heading: new Set(["type", "version", "tag", "children"]),
  quote: new Set(["type", "version", "children"]),
  list: new Set(["type", "version", "listType", "start", "children"]),
  listitem: new Set(["type", "version", "value", "checked", "children"]),
  link: new Set(["type", "version", "url", "title", "children"]),
  autolink: new Set(["type", "version", "url", "title", "children"]),
  code: new Set(["type", "version", "language", "children"]),
  "code-highlight": new Set(["type", "version", "text", "highlightType"]),
  horizontalrule: new Set(["type", "version"]),
  image: new Set(["type", "version", "src", "alt", "caption", "alignment"]),
  "iframe-embed": new Set(["type", "version", "src", "caption"]),
  "youtube-embed": new Set(["type", "version", "src", "caption"]),
  table: new Set(["type", "version", "children"]),
  tablerow: new Set(["type", "version", "children"]),
  tablecell: new Set(["type", "version", "children"]),
};

function deepClone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function hasOwnEntries(record: JsonRecord): boolean {
  return Object.keys(record).length > 0;
}

function isDefaultExtraValue(key: string, value: unknown): boolean {
  switch (key) {
    case "textFormat":
      return value === 0;
    case "textStyle":
      return value === "";
    case "format":
      return value === "" || value === 0;
    case "indent":
      return value === 0;
    case "direction":
      return value === null;
    case "detail":
      return value === 0;
    case "mode":
      return value === "normal";
    case "style":
      return value === "" || value === null;
    case "headerState":
      return value === 0;
    case "colSpan":
    case "rowSpan":
      return value === 1;
    case "width":
    case "height":
      return value === null || value === undefined;
    case "backgroundColor":
      return value === null || value === "";
    case "verticalAlign":
      return value === null || value === undefined || value === "";
    case "rowStriping":
      return value === false;
    case "frozenColumnCount":
    case "frozenRowCount":
      return value === 0;
    case "colWidths":
      return Array.isArray(value) && value.length === 0;
    case "uploading":
      return value === false || value === undefined;
    case "title":
      return value === "" || value === null || value === undefined;
    default:
      return false;
  }
}

function isDefaultMarkdownExtraValue(type: string, key: string, value: unknown): boolean {
  if (isDefaultExtraValue(key, value)) {
    return true;
  }

  if (type === "iframe-embed") {
    if (key === "width") {
      return value === 640;
    }
    if (key === "height") {
      return value === 360;
    }
    if (key === "alignment") {
      return value === "center";
    }
  }

  if (type === "youtube-embed") {
    if (key === "width") {
      return value === 640;
    }
    if (key === "height") {
      return value === 360;
    }
    if (key === "alignment") {
      return value === "center";
    }
    if (key === "start") {
      return value === 0;
    }
  }

  return false;
}

function extractMarkdownPatch(node: JsonRecord, type: string): JsonRecord | null {
  const nativeKeys = MARKDOWN_NATIVE_KEYS[type];
  if (!nativeKeys) {
    return null;
  }

  const patch: JsonRecord = {};

  for (const [key, value] of Object.entries(node)) {
    if (key === "children" || key === "type") {
      continue;
    }

    if (type === "text" && key === "format" && typeof value === "number") {
      const extraBits = value & ~MARKDOWN_TEXT_NATIVE_FORMAT_MASK;
      if (extraBits !== 0) {
        patch.__luthorTextFormatExtra = extraBits;
      }
      continue;
    }

    if (nativeKeys.has(key)) {
      continue;
    }

    if (value === undefined) {
      continue;
    }

    if (isDefaultMarkdownExtraValue(type, key, value)) {
      continue;
    }

    patch[key] = deepClone(value);
  }

  return hasOwnEntries(patch) ? patch : null;
}

function collectMarkdownPartialEnvelopes(input: unknown): MetadataEnvelope[] {
  return collectSupportedNodeMetadataPatches(input, {
    mode: "markdown",
    supportedNodeTypes: MARKDOWN_SUPPORTED_NODE_TYPES,
    extractPatch: ({ node, type }) => extractMarkdownPatch(node, type),
  });
}

function createMarkdownEditor() {
  return createEditor({
    namespace: "luthor-markdown-converter",
    onError: (error) => {
      throw error;
    },
    nodes: [
      ParagraphNode,
      TextNode,
      LineBreakNode,
      TabNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      HorizontalRuleNode,
      ImageNode,
      IframeEmbedNode,
      YouTubeEmbedNode,
      TableNode,
      TableRowNode,
      TableCellNode,
    ],
  });
}

function toEditorState(editor: ReturnType<typeof createMarkdownEditor>, input: unknown): EditorState {
  const serialized = typeof input === "string" ? input : JSON.stringify(input ?? {});
  return editor.parseEditorState(serialized);
}

type BlockAlignment = "left" | "center" | "right" | "justify";

type AlignmentMarker =
  | { type: "start"; alignment: BlockAlignment }
  | { type: "end" };

const ALIGNMENT_START_MARKER_PREFIX = "[[LUTHOR_ALIGN_START:";
const ALIGNMENT_START_MARKER_SUFFIX = "]]";
const ALIGNMENT_END_MARKER = "[[LUTHOR_ALIGN_END]]";

let cachedEmojiShortcodeLookup: ReadonlyMap<string, string> | null = null;
let cachedEmojiShortcodeLookupSource: "global" | "module" | null = null;

type EmojiMartSkinLike = {
  native?: unknown;
};

type EmojiMartEntryLike = {
  shortcodes?: unknown;
  skins?: unknown;
  native?: unknown;
};

type EmojiMartDatasetLike = {
  emojis?: unknown;
};

function normalizeMarkdownLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function normalizeEmojiShortcode(value: string): string {
  return value.trim().toLowerCase().replace(/^:+|:+$/g, "");
}

function toEmojiShortcodeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? normalizeEmojiShortcode(entry) : ""))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((entry) => normalizeEmojiShortcode(entry))
      .filter((entry) => entry.length > 0);
  }

  return [];
}

function extractNativeEmoji(entry: EmojiMartEntryLike): string | null {
  if (typeof entry.native === "string" && entry.native.length > 0) {
    return entry.native;
  }

  if (!Array.isArray(entry.skins)) {
    return null;
  }

  for (const rawSkin of entry.skins) {
    if (typeof rawSkin !== "object" || rawSkin === null || Array.isArray(rawSkin)) {
      continue;
    }

    const skin = rawSkin as EmojiMartSkinLike;
    if (typeof skin.native === "string" && skin.native.length > 0) {
      return skin.native;
    }
  }

  return null;
}

function createEmojiShortcodeLookup(rawData: unknown): ReadonlyMap<string, string> | null {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    return null;
  }

  const dataset = rawData as EmojiMartDatasetLike;
  if (!dataset.emojis || typeof dataset.emojis !== "object" || Array.isArray(dataset.emojis)) {
    return null;
  }

  const lookup = new Map<string, string>();
  for (const [id, rawEntry] of Object.entries(dataset.emojis as Record<string, unknown>)) {
    if (typeof rawEntry !== "object" || rawEntry === null || Array.isArray(rawEntry)) {
      continue;
    }

    const entry = rawEntry as EmojiMartEntryLike;
    const emoji = extractNativeEmoji(entry);
    if (!emoji) {
      continue;
    }

    const shortcodes = Array.from(
      new Set([
        normalizeEmojiShortcode(id),
        ...toEmojiShortcodeArray(entry.shortcodes),
      ].filter((shortcode) => shortcode.length > 0)),
    );

    for (const shortcode of shortcodes) {
      if (!lookup.has(shortcode)) {
        lookup.set(shortcode, emoji);
      }
    }
  }

  return lookup.size > 0 ? lookup : null;
}

function tryResolveEmojiShortcodesFromGlobalScope(): ReadonlyMap<string, string> | null {
  const globalData = (
    globalThis as Record<string, unknown> & {
      EmojiMart?: { data?: unknown };
    }
  ).__EMOJI_MART_DATA__ ?? (globalThis as { EmojiMart?: { data?: unknown } }).EmojiMart?.data;
  return createEmojiShortcodeLookup(globalData);
}

function tryResolveEmojiShortcodesFromModule(): ReadonlyMap<string, string> | null {
  try {
    const requireFunction = new Function(
      "return typeof require === 'function' ? require : null;",
    )() as ((moduleName: string) => unknown) | null;
    if (!requireFunction) {
      return null;
    }

    const imported = requireFunction("@emoji-mart/data") as {
      default?: unknown;
      data?: unknown;
    };
    return (
      createEmojiShortcodeLookup(imported.default) ??
      createEmojiShortcodeLookup(imported.data) ??
      createEmojiShortcodeLookup(imported)
    );
  } catch {
    return null;
  }
}

function resolveEmojiShortcodeLookup(): ReadonlyMap<string, string> | null {
  const fromGlobal = tryResolveEmojiShortcodesFromGlobalScope();
  if (fromGlobal) {
    cachedEmojiShortcodeLookup = fromGlobal;
    cachedEmojiShortcodeLookupSource = "global";
    return fromGlobal;
  }

  if (cachedEmojiShortcodeLookupSource === "global") {
    cachedEmojiShortcodeLookup = null;
    cachedEmojiShortcodeLookupSource = null;
  }

  if (cachedEmojiShortcodeLookup) {
    return cachedEmojiShortcodeLookup;
  }

  const fromModule = tryResolveEmojiShortcodesFromModule();
  if (fromModule) {
    cachedEmojiShortcodeLookup = fromModule;
    cachedEmojiShortcodeLookupSource = "module";
    return fromModule;
  }

  return null;
}

function normalizeEmojiShortcodes(input: string): string {
  const lookup = resolveEmojiShortcodeLookup();
  if (!lookup) {
    return input;
  }

  return input.replace(/:([a-z0-9_+-]+):/gi, (match, shortcode) => {
    const normalizedShortcode = normalizeEmojiShortcode(String(shortcode));
    return lookup.get(normalizedShortcode) ?? match;
  });
}

function convertNestedImageLinksToMarkdownImages(input: string): string {
  return input.replace(
    /\[!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\]\(([^)]+)\)/g,
    (_match, alt, src, title, linkTarget) => {
      void linkTarget;
      let markdown = `![${String(alt)}](${String(src)}`;
      if (typeof title === "string" && title.length > 0) {
        markdown += ` "${title}"`;
      }
      markdown += ")";
      return markdown;
    },
  );
}

function convertSimpleInlineHtmlToMarkdown(input: string): string {
  return input
    .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<\/?span\b[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/<\/?[^>]+>/g, "");
}

function isBlockAlignment(value: string): value is BlockAlignment {
  return value === "left" || value === "center" || value === "right" || value === "justify";
}

function parseHTMLAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributeRegex =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

  let match = attributeRegex.exec(source);
  while (match) {
    const key = (match[1] ?? "").trim().toLowerCase();
    const value = (match[2] ?? match[3] ?? match[4] ?? "").trim();
    if (key) {
      attributes[key] = value;
    }
    match = attributeRegex.exec(source);
  }

  return attributes;
}

function extractAlignmentFromAttributes(attributes: Record<string, string>): BlockAlignment | null {
  const alignValue = attributes.align?.trim().toLowerCase();
  if (alignValue && isBlockAlignment(alignValue)) {
    return alignValue;
  }

  const styleValue = attributes.style?.toLowerCase() ?? "";
  if (styleValue) {
    const textAlignMatch = styleValue.match(/text-align\s*:\s*(left|center|right|justify)\b/);
    const textAlign = textAlignMatch?.[1]?.toLowerCase();
    if (textAlign && isBlockAlignment(textAlign)) {
      return textAlign;
    }

    const floatMatch = styleValue.match(/float\s*:\s*(left|right)\b/);
    const floatValue = floatMatch?.[1]?.toLowerCase();
    if (floatValue === "left" || floatValue === "right") {
      return floatValue;
    }
  }

  const classValue = attributes.class?.toLowerCase() ?? "";
  if (classValue.includes("align-center")) {
    return "center";
  }
  if (classValue.includes("align-left")) {
    return "left";
  }
  if (classValue.includes("align-right")) {
    return "right";
  }

  return null;
}

function extractAlignmentFromTag(tagSource: string): BlockAlignment | null {
  return extractAlignmentFromAttributes(parseHTMLAttributes(tagSource));
}

function escapeMarkdownAltText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\]/g, "\\]");
}

function toImageAlignment(alignment: BlockAlignment | null): "left" | "center" | "right" | null {
  if (alignment === "left" || alignment === "center" || alignment === "right") {
    return alignment;
  }

  if (alignment === "justify") {
    return "center";
  }

  return null;
}

function markdownImageFromHtmlTag(
  tagSource: string,
  inheritedAlignment: BlockAlignment | null = null,
): string | null {
  const imageTagMatch = tagSource.match(/<img\b[^>]*>/i);
  if (!imageTagMatch) {
    return null;
  }

  const attributes = parseHTMLAttributes(imageTagMatch[0]);
  const src = attributes.src?.trim();
  if (!src) {
    return null;
  }

  const alt = attributes.alt?.trim() ?? "";
  const title = attributes.title?.trim() ?? "";
  const alignment = toImageAlignment(
    extractAlignmentFromAttributes(attributes) ?? inheritedAlignment,
  );

  let markdown = `![${escapeMarkdownAltText(alt)}](${src}`;
  if (title.length > 0) {
    markdown += ` "${escapeMarkdownTitle(title)}"`;
  }
  markdown += ")";

  if (alignment) {
    markdown += ` <!-- align:${alignment} -->`;
  }

  return markdown;
}

function createAlignmentStartMarker(alignment: BlockAlignment): string {
  return `${ALIGNMENT_START_MARKER_PREFIX}${alignment}${ALIGNMENT_START_MARKER_SUFFIX}`;
}

function preprocessMarkdownForMetadataFreeImport(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      output.push(line);
      continue;
    }

    const singleLineContainerMatch = trimmed.match(/^<(div|p)\b([^>]*)>([\s\S]*?)<\/\1>$/i);
    if (singleLineContainerMatch) {
      const alignment = extractAlignmentFromTag(trimmed);
      const innerContent = singleLineContainerMatch[3] ?? "";
      if (alignment) {
        output.push(createAlignmentStartMarker(alignment));
      }
      const markdownImage = markdownImageFromHtmlTag(innerContent, alignment);
      if (markdownImage) {
        output.push(markdownImage);
      } else {
        const normalizedInline = normalizeEmojiShortcodes(
          convertNestedImageLinksToMarkdownImages(convertSimpleInlineHtmlToMarkdown(innerContent)),
        );
        if (normalizedInline.trim().length > 0) {
          output.push(normalizedInline);
        }
      }
      if (alignment) {
        output.push(ALIGNMENT_END_MARKER);
      }
      continue;
    }

    if (/^<picture\b/i.test(trimmed)) {
      const pictureLines = [line];
      while (index + 1 < lines.length) {
        index += 1;
        const nextLine = lines[index] ?? "";
        pictureLines.push(nextLine);
        if (/<\/picture>/i.test(nextLine)) {
          break;
        }
      }

      const pictureImage = markdownImageFromHtmlTag(pictureLines.join("\n"));
      if (pictureImage) {
        output.push(pictureImage);
      }
      continue;
    }

    if (/^<source\b/i.test(trimmed) || /^<\/?picture\b/i.test(trimmed)) {
      continue;
    }

    const alignmentStartMatch = trimmed.match(/^<(div|p)\b([^>]*)>$/i);
    if (alignmentStartMatch) {
      const alignment = extractAlignmentFromTag(trimmed);
      if (alignment) {
        output.push(createAlignmentStartMarker(alignment));
      }
      continue;
    }

    if (/^<\/(div|p)>$/i.test(trimmed)) {
      output.push(ALIGNMENT_END_MARKER);
      continue;
    }

    if (/^<img\b[\s\S]*\/?>$/i.test(trimmed)) {
      const markdownImage = markdownImageFromHtmlTag(trimmed);
      if (markdownImage) {
        output.push(markdownImage);
        continue;
      }
    }

    const paragraphMatch = trimmed.match(/^<p\b[^>]*>([\s\S]*?)<\/p>$/i);
    if (paragraphMatch) {
      const paragraphAlignment = extractAlignmentFromTag(trimmed);
      const innerContent = paragraphMatch[1] ?? "";
      if (paragraphAlignment) {
        output.push(createAlignmentStartMarker(paragraphAlignment));
      }
      const markdownImage = markdownImageFromHtmlTag(innerContent, paragraphAlignment);
      if (markdownImage) {
        output.push(markdownImage);
      } else {
        const normalizedInline = normalizeEmojiShortcodes(
          convertNestedImageLinksToMarkdownImages(convertSimpleInlineHtmlToMarkdown(innerContent)),
        );
        if (normalizedInline.trim().length > 0) {
          output.push(normalizedInline);
        }
      }
      if (paragraphAlignment) {
        output.push(ALIGNMENT_END_MARKER);
      }
      continue;
    }

    const normalizedLine = normalizeEmojiShortcodes(convertNestedImageLinksToMarkdownImages(line));
    output.push(normalizedLine);
  }

  return output.join("\n");
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getParagraphTextContent(node: JsonRecord): string | null {
  if (node.type !== "paragraph" || !Array.isArray(node.children)) {
    return null;
  }

  let content = "";
  for (const child of node.children) {
    if (!isJsonRecord(child)) {
      return null;
    }

    if (child.type === "text") {
      content += typeof child.text === "string" ? child.text : "";
      continue;
    }

    if (child.type === "linebreak") {
      content += "\n";
      continue;
    }

    if (child.type === "tab") {
      content += "\t";
      continue;
    }

    return null;
  }

  return content;
}

function extractAlignmentMarker(node: JsonRecord): AlignmentMarker | null {
  const text = getParagraphTextContent(node);
  if (text === null) {
    return null;
  }

  const trimmed = text.trim();
  if (trimmed === ALIGNMENT_END_MARKER) {
    return { type: "end" };
  }

  if (
    trimmed.startsWith(ALIGNMENT_START_MARKER_PREFIX) &&
    trimmed.endsWith(ALIGNMENT_START_MARKER_SUFFIX)
  ) {
    const alignmentValue = trimmed
      .slice(ALIGNMENT_START_MARKER_PREFIX.length, trimmed.length - ALIGNMENT_START_MARKER_SUFFIX.length)
      .trim()
      .toLowerCase();
    if (isBlockAlignment(alignmentValue)) {
      return { type: "start", alignment: alignmentValue };
    }
  }

  return null;
}

function applyAlignmentToNode(node: JsonRecord, alignment: BlockAlignment): void {
  const type = typeof node.type === "string" ? node.type : "";
  if (type === "image") {
    const imageAlignment = toImageAlignment(alignment);
    if (!imageAlignment) {
      return;
    }

    const currentAlignment = node.alignment;
    if (
      currentAlignment === undefined ||
      currentAlignment === null ||
      currentAlignment === "" ||
      currentAlignment === "none"
    ) {
      node.alignment = imageAlignment;
    }
    return;
  }

  if (
    type === "paragraph" ||
    type === "heading" ||
    type === "quote" ||
    type === "list" ||
    type === "table" ||
    type === "code"
  ) {
    node.format = alignment;
  }
}

function applyAlignmentMarkersToDocument(document: JsonDocument): JsonDocument {
  if (!isJsonRecord(document.root) || !Array.isArray(document.root.children)) {
    return document;
  }

  const alignmentStack: BlockAlignment[] = [];
  const normalizedChildren: unknown[] = [];

  for (const child of document.root.children) {
    if (!isJsonRecord(child)) {
      normalizedChildren.push(child);
      continue;
    }

    const marker = extractAlignmentMarker(child);
    if (marker) {
      if (marker.type === "start") {
        alignmentStack.push(marker.alignment);
      } else {
        alignmentStack.pop();
      }
      continue;
    }

    const activeAlignment = alignmentStack[alignmentStack.length - 1];
    if (activeAlignment) {
      applyAlignmentToNode(child, activeAlignment);
    }
    normalizedChildren.push(child);
  }

  document.root.children = normalizedChildren;
  return document;
}

function shouldPreserveMetadata(metadataMode: SourceMetadataMode | undefined): boolean {
  return metadataMode !== "none";
}

export function markdownToJSON(
  markdown: string,
  options?: MarkdownBridgeOptions,
): JsonDocument {
  const preserveMetadata = shouldPreserveMetadata(options?.metadataMode);
  const { content, envelopes, warnings } = preserveMetadata
    ? extractMetadataEnvelopes(markdown)
    : { content: markdown, envelopes: [], warnings: [] as string[] };

  if (preserveMetadata) {
    for (const warning of warnings) {
      console.warn(`[luthor-headless] ${warning}`);
    }
  }

  const sourceContent = preserveMetadata
    ? content
    : preprocessMarkdownForMetadataFreeImport(content);

  const editor = createMarkdownEditor();
  editor.update(
    () => {
      $convertFromMarkdownString(sourceContent, MARKDOWN_TRANSFORMERS);
    },
    { discrete: true },
  );

  const baseDocument = editor.getEditorState().toJSON() as JsonDocument;
  const normalizedDocument = preserveMetadata
    ? baseDocument
    : applyAlignmentMarkersToDocument(baseDocument);
  return rehydrateDocumentFromEnvelopes(normalizedDocument, envelopes);
}

export function jsonToMarkdown(
  input: unknown,
  options?: MarkdownBridgeOptions,
): string {
  const preserveMetadata = shouldPreserveMetadata(options?.metadataMode);
  const prepared = prepareDocumentForBridge(input, {
    mode: "markdown",
    supportedNodeTypes: MARKDOWN_SUPPORTED_NODE_TYPES,
  });
  const partialEnvelopes = preserveMetadata ? collectMarkdownPartialEnvelopes(input) : [];
  const editor = createMarkdownEditor();
  const editorState = toEditorState(editor, prepared.document);
  editor.setEditorState(editorState, { tag: "history-merge" });

  const markdown = editorState.read(() => {
    return $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
  });

  if (!preserveMetadata) {
    return markdown;
  }

  return appendMetadataEnvelopes(markdown, [...prepared.envelopes, ...partialEnvelopes]);
}
