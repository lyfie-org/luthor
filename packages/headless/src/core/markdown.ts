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
export type MarkdownBridgeFlavor = "github" | "luthor" | "lexical-native";

export interface MarkdownBridgeOptions {
  metadataMode?: SourceMetadataMode;
  bridgeFlavor?: MarkdownBridgeFlavor;
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

type MarkdownTableAlignment = "left" | "center" | "right";

function escapeMarkdownTableCell(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "<br>");
}

function unescapeMarkdownTableCell(value: string): string {
  return value
    .replace(/\\\|/g, "|")
    .replace(/<br\s*\/?>/gi, "\n");
}

function parseMarkdownTableSeparatorAlignment(
  token: string,
): MarkdownTableAlignment | null | undefined {
  const normalized = token.trim();
  if (!normalized || !/^:?-{3,}:?$/.test(normalized)) {
    return undefined;
  }

  const startsWithColon = normalized.startsWith(":");
  const endsWithColon = normalized.endsWith(":");
  if (startsWithColon && endsWithColon) {
    return "center";
  }
  if (startsWithColon) {
    return "left";
  }
  if (endsWithColon) {
    return "right";
  }
  return null;
}

function markdownTableSeparatorFromAlignment(
  alignment: MarkdownTableAlignment | null,
): string {
  if (alignment === "left") {
    return ":---";
  }
  if (alignment === "center") {
    return ":---:";
  }
  if (alignment === "right") {
    return "---:";
  }
  return "---";
}

function splitMarkdownTableRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) {
    return [];
  }

  let rowContent = trimmed;
  if (rowContent.startsWith("|")) {
    rowContent = rowContent.slice(1);
  }
  if (rowContent.endsWith("|")) {
    rowContent = rowContent.slice(0, -1);
  }

  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (const char of rowContent) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (char === "|") {
      cells.push(unescapeMarkdownTableCell(current.trim()));
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(unescapeMarkdownTableCell(current.trim()));
  return cells;
}

function getTableCellAlignment(cell: TableCellNode): MarkdownTableAlignment | null {
  const format = cell.getFormatType();
  if (format === "left" || format === "center" || format === "right") {
    return format;
  }
  return null;
}

function getTableColumnAlignment(
  rows: readonly TableCellNode[][],
  columnIndex: number,
): MarkdownTableAlignment | null {
  for (const row of rows) {
    const cell = row[columnIndex];
    if (!cell) {
      continue;
    }

    const alignment = getTableCellAlignment(cell);
    if (alignment) {
      return alignment;
    }
  }

  return null;
}

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

    const tableRows: TableCellNode[][] = [];
    rows.forEach((rowNode) => {
      if (!$isTableRowNode(rowNode)) {
        return;
      }

      const rowCells: TableCellNode[] = [];
      rowNode.getChildren().forEach((cellNode) => {
        if (!$isTableCellNode(cellNode)) {
          return;
        }

        rowCells.push(cellNode);
      });

      tableRows.push(rowCells);
    });

    if (tableRows.length === 0 || !tableRows[0]) {
      return null;
    }

    const columnCount = Math.max(...tableRows.map((tableRow) => tableRow.length));
    if (!Number.isFinite(columnCount) || columnCount < 1) {
      return null;
    }

    const formatRow = (rowCells: readonly TableCellNode[]): string => {
      const cells = Array.from({ length: columnCount }, (_, columnIndex) => {
        const text = rowCells[columnIndex]?.getTextContent().trim() ?? "";
        return escapeMarkdownTableCell(text);
      });

      return `| ${cells.join(" | ")} |`;
    };

    const markdownLines: string[] = [];
    markdownLines.push(formatRow(tableRows[0]));
    markdownLines.push(
      `| ${Array.from({ length: columnCount }, (_, columnIndex) => (
        markdownTableSeparatorFromAlignment(
          getTableColumnAlignment(tableRows, columnIndex),
        )
      )).join(" | ")} |`,
    );

    for (let rowIndex = 1; rowIndex < tableRows.length; rowIndex += 1) {
      markdownLines.push(formatRow(tableRows[rowIndex] ?? []));
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

    const parsedRows = tableLines
      .map((line) => splitMarkdownTableRow(line))
      .filter((row) => row.length > 0);

    if (parsedRows.length < 2 || !parsedRows[0]) {
      return;
    }

    const headerRow = parsedRows[0];
    const separatorRow = parsedRows[1] ?? [];
    const separatorAlignments = separatorRow.map((cell) => (
      parseMarkdownTableSeparatorAlignment(cell)
    ));
    const hasValidSeparator = separatorAlignments.length > 0 &&
      separatorAlignments.every((alignment) => alignment !== undefined);
    if (!hasValidSeparator) {
      return;
    }

    const dataRows = [headerRow, ...parsedRows.slice(2)];
    const columnCount = Math.max(
      headerRow.length,
      separatorRow.length,
      ...dataRows.map((row) => row.length),
    );
    if (!Number.isFinite(columnCount) || columnCount < 1) {
      return;
    }

    const tableNode = $createTableNodeWithDimensions(
      Math.max(dataRows.length, 1),
      columnCount,
      true,
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

        const alignment = separatorAlignments[cellIndex] ?? null;
        if (alignment === "left" || alignment === "center" || alignment === "right") {
          cell.setFormat(alignment);
        }
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

const LEXICAL_NATIVE_MARKDOWN_TRANSFORMERS: Transformer[] = [...TRANSFORMERS];
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
  root: new Set(["type", "version", "children", "frontmatter"]),
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
  image: new Set([
    "type",
    "version",
    "src",
    "alt",
    "caption",
    "linkHref",
    "linkTitle",
    "alignment",
  ]),
  "iframe-embed": new Set(["type", "version", "src", "caption"]),
  "youtube-embed": new Set(["type", "version", "src", "caption"]),
  table: new Set(["type", "version", "children"]),
  tablerow: new Set(["type", "version", "children"]),
  tablecell: new Set(["type", "version", "headerState", "format", "children"]),
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

function createLexicalNativeMarkdownEditor() {
  return createEditor({
    namespace: "luthor-lexical-markdown-converter",
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
    ],
  });
}

function toEditorState(editor: ReturnType<typeof createEditor>, input: unknown): EditorState {
  const serialized = typeof input === "string" ? input : JSON.stringify(input ?? {});
  return editor.parseEditorState(serialized);
}

type BlockAlignment = "left" | "center" | "right" | "justify";

type AlignmentMarker =
  | { type: "start"; alignment: BlockAlignment }
  | { type: "end" };

const ALIGNMENT_START_MARKER_PREFIX = "[[LUTHORALIGNSTART:";
const ALIGNMENT_START_MARKER_SUFFIX = "]]";
const ALIGNMENT_END_MARKER = "[[LUTHORALIGNEND]]";

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
  const toLinkDirective = (linkHref: string, linkTitle?: string): string => {
    const href = linkHref.trim();
    if (!href) {
      return "";
    }

    const titlePart = linkTitle && linkTitle.trim().length > 0
      ? ` "${escapeMarkdownTitle(linkTitle.trim())}"`
      : "";
    return ` <!-- link:${href}${titlePart} -->`;
  };

  return input.replace(
    /\[!\[((?:\\.|[^\]])*)\]\(([^)\s]+)(?:\s+"((?:[^"\\]|\\.)*)")?\)\]\((<[^>\r\n]+>|[^)\s]+)(?:\s+"((?:[^"\\]|\\.)*)")?\)/g,
    (_match, alt, src, imageTitle, linkTarget, linkTitle) => {
      const hrefToken = String(linkTarget ?? "").trim();
      const href = hrefToken.startsWith("<") && hrefToken.endsWith(">")
        ? hrefToken.slice(1, -1).trim()
        : hrefToken;
      if (!href) {
        return _match;
      }

      let markdown = `![${String(alt)}](${String(src)}`;
      if (typeof imageTitle === "string" && imageTitle.length > 0) {
        markdown += ` "${escapeMarkdownTitle(unescapeMarkdownTitle(imageTitle))}"`;
      }
      markdown += ")";
      markdown += toLinkDirective(
        href,
        typeof linkTitle === "string" && linkTitle.length > 0
          ? unescapeMarkdownTitle(linkTitle)
          : undefined,
      );
      return markdown;
    },
  );
}

function normalizeNestedImageLinks(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const output: string[] = [];
  let activeFence: { marker: "`" | "~"; length: number } | null = null;

  for (const line of lines) {
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }

      output.push(line);
      continue;
    }

    if (activeFence) {
      output.push(line);
      continue;
    }

    output.push(convertNestedImageLinksToMarkdownImages(line));
  }

  return output.join("\n");
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

function stripFigureCaptionMarkup(markup: string): string {
  return markup.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, "");
}

function extractFigureCaption(markup: string): string | null {
  const captionMatch = markup.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
  if (!captionMatch) {
    return null;
  }

  const captionContent = captionMatch[1] ?? "";
  const normalizedCaption = normalizeEmojiShortcodes(
    convertSimpleInlineHtmlToMarkdown(captionContent),
  ).replace(/\s+/g, " ").trim();

  return normalizedCaption.length > 0 ? normalizedCaption : null;
}

function markdownImageFromHtmlTag(
  tagSource: string,
  inheritedAlignment: BlockAlignment | null = null,
  captionOverride?: string | null,
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
  const title = (captionOverride?.trim() || attributes.title?.trim() || "");
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

type MarkdownFrontmatterExtraction = {
  frontmatter: string | null;
  content: string;
};

type MarkdownReferenceDefinition = {
  url: string;
  title?: string;
};

const GITHUB_ALERT_LABELS: Readonly<Record<string, string>> = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
};

const GITHUB_ALERT_TYPES_BY_LABEL = new Map<string, string>(
  Object.entries(GITHUB_ALERT_LABELS).map(([type, label]) => [
    label.toLowerCase(),
    type,
  ]),
);

function isFenceDelimiterLine(line: string): {
  marker: "`" | "~";
  length: number;
} | null {
  const match = line.match(/^\s{0,3}([`~]{3,})/);
  if (!match || !match[1]) {
    return null;
  }

  const token = match[1];
  const marker = token[0];
  if (marker !== "`" && marker !== "~") {
    return null;
  }

  return {
    marker,
    length: token.length,
  };
}

function normalizeReferenceId(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function parseReferenceDefinition(
  line: string,
): { id: string; definition: MarkdownReferenceDefinition } | null {
  const match = line.match(
    /^\s{0,3}\[([^\]]+)\]:\s*(<[^>\r\n]+>|[^\s]+)(?:\s+(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|\(([^)\r\n]*)\)))?\s*$/,
  );
  if (!match || !match[1] || !match[2]) {
    return null;
  }

  const rawId = normalizeReferenceId(match[1]);
  if (!rawId) {
    return null;
  }

  const rawUrl = match[2].trim();
  const normalizedUrl = rawUrl.startsWith("<") && rawUrl.endsWith(">")
    ? rawUrl.slice(1, -1).trim()
    : rawUrl;
  if (!normalizedUrl) {
    return null;
  }

  const rawTitle = match[3] ?? match[4] ?? match[5] ?? "";
  const title = rawTitle ? unescapeMarkdownTitle(rawTitle.trim()) : undefined;

  return {
    id: rawId,
    definition: {
      url: normalizedUrl,
      ...(title ? { title } : {}),
    },
  };
}

function normalizeReferenceStyleMarkdown(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const definitions = new Map<string, MarkdownReferenceDefinition>();
  const output: string[] = [];

  let activeFence: { marker: "`" | "~"; length: number } | null = null;
  for (const line of lines) {
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }

      output.push(line);
      continue;
    }

    if (activeFence) {
      output.push(line);
      continue;
    }

    const parsedDefinition = parseReferenceDefinition(line);
    if (parsedDefinition) {
      definitions.set(parsedDefinition.id, parsedDefinition.definition);
      continue;
    }

    output.push(line);
  }

  if (definitions.size === 0) {
    return output.join("\n");
  }

  const resolveDefinition = (rawReference: string, fallbackText?: string) => {
    const reference = rawReference.trim().length > 0
      ? rawReference
      : (fallbackText ?? "");
    return definitions.get(normalizeReferenceId(reference));
  };

  const withReferencesExpanded: string[] = [];
  activeFence = null;
  for (const line of output) {
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }
      withReferencesExpanded.push(line);
      continue;
    }

    if (activeFence) {
      withReferencesExpanded.push(line);
      continue;
    }

    let normalizedLine = line;
    normalizedLine = normalizedLine.replace(
      /!\[([^\]]*)\]\[([^\]]*)\]/g,
      (match, altText, referenceId) => {
        const alt = String(altText ?? "");
        const definition = resolveDefinition(String(referenceId ?? ""), alt);
        if (!definition) {
          return match;
        }

        const titlePart = definition.title
          ? ` "${escapeMarkdownTitle(definition.title)}"`
          : "";
        return `![${escapeMarkdownAltText(alt)}](${definition.url}${titlePart})`;
      },
    );

    normalizedLine = normalizedLine.replace(
      /(^|[^!])\[([^\]]+)\]\[([^\]]*)\]/g,
      (match, prefix, label, referenceId) => {
        const text = String(label ?? "");
        const definition = resolveDefinition(String(referenceId ?? ""), text);
        if (!definition) {
          return match;
        }

        const titlePart = definition.title
          ? ` "${escapeMarkdownTitle(definition.title)}"`
          : "";
        return `${String(prefix ?? "")}[${text}](${definition.url}${titlePart})`;
      },
    );

    withReferencesExpanded.push(normalizedLine);
  }

  return withReferencesExpanded.join("\n");
}

function normalizeGitHubAlertBlocks(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const output: string[] = [];
  let activeFence: { marker: "`" | "~"; length: number } | null = null;

  for (const line of lines) {
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }

      output.push(line);
      continue;
    }

    if (activeFence) {
      output.push(line);
      continue;
    }

    const alertMatch = line.match(/^(\s*(?:>\s*)+)\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
    if (!alertMatch || !alertMatch[1] || !alertMatch[2]) {
      output.push(line);
      continue;
    }

    const alertType = alertMatch[2].toUpperCase();
    const label = GITHUB_ALERT_LABELS[alertType] ?? alertType;
    const body = (alertMatch[3] ?? "").trim();
    output.push(
      body.length > 0
        ? `${alertMatch[1]}**${label}:** ${body}`
        : `${alertMatch[1]}**${label}:**`,
    );
  }

  return output.join("\n");
}

function normalizeMathBlockSyntax(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const output: string[] = [];
  let activeFence: { marker: "`" | "~"; length: number } | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }
      output.push(line);
      continue;
    }

    if (activeFence) {
      output.push(line);
      continue;
    }

    if (line.trim() !== "$$") {
      output.push(line);
      continue;
    }

    const mathLines: string[] = [];
    let closingFound = false;
    while (index + 1 < lines.length) {
      index += 1;
      const nextLine = lines[index] ?? "";
      if (nextLine.trim() === "$$") {
        closingFound = true;
        break;
      }
      mathLines.push(nextLine);
    }

    if (!closingFound) {
      output.push(line);
      output.push(...mathLines);
      continue;
    }

    output.push("```math");
    output.push(...mathLines);
    output.push("```");
  }

  return output.join("\n");
}

function normalizeFootnoteAnchorId(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "footnote";
}

function normalizeFootnoteSyntax(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const output: string[] = [];
  const footnoteOrder: string[] = [];
  const footnoteDefinitions = new Map<string, string>();

  let activeFence: { marker: "`" | "~"; length: number } | null = null;
  let activeDefinitionId: string | null = null;

  for (const line of lines) {
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      activeDefinitionId = null;
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }
      output.push(line);
      continue;
    }

    if (activeFence) {
      output.push(line);
      continue;
    }

    const definitionMatch = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (definitionMatch && definitionMatch[1]) {
      const definitionId = definitionMatch[1].trim();
      if (!definitionId) {
        output.push(line);
        continue;
      }

      const definitionBody = (definitionMatch[2] ?? "").trim();
      if (!footnoteDefinitions.has(definitionId)) {
        footnoteOrder.push(definitionId);
      }
      footnoteDefinitions.set(definitionId, definitionBody);
      activeDefinitionId = definitionId;
      continue;
    }

    if (activeDefinitionId && /^( {2,}|\t)/.test(line)) {
      const continuation = line.replace(/^( {2,}|\t)/, "").trim();
      const previous = footnoteDefinitions.get(activeDefinitionId) ?? "";
      footnoteDefinitions.set(
        activeDefinitionId,
        continuation.length > 0
          ? `${previous}\n${continuation}`.trim()
          : previous,
      );
      continue;
    }

    activeDefinitionId = null;
    output.push(line);
  }

  if (footnoteDefinitions.size === 0) {
    return output.join("\n");
  }

  const referencesNormalized: string[] = [];
  activeFence = null;
  for (const line of output) {
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }
      referencesNormalized.push(line);
      continue;
    }

    if (activeFence) {
      referencesNormalized.push(line);
      continue;
    }

    const normalizedLine = line.replace(/\[\^([^\]\s]+)\]/g, (match, rawId) => {
      const id = String(rawId ?? "").trim();
      if (!id || !footnoteDefinitions.has(id)) {
        return match;
      }

      const anchorId = normalizeFootnoteAnchorId(id);
      return `[^${id}](#fn-${anchorId})`;
    });
    referencesNormalized.push(normalizedLine);
  }

  if (footnoteOrder.length === 0) {
    return referencesNormalized.join("\n");
  }

  const normalizedFootnotes = footnoteOrder.map((id, index) => {
    const anchorId = normalizeFootnoteAnchorId(id);
    const definition = (footnoteDefinitions.get(id) ?? "").trim();
    const flattenedDefinition = definition.replace(/\n+/g, " ").trim();
    return `${index + 1}. <a id="fn-${anchorId}"></a> **[^${id}]**${flattenedDefinition ? ` ${flattenedDefinition}` : ""}`;
  });

  const body = referencesNormalized.join("\n").replace(/\n+$/g, "");
  return `${body}\n\n---\n\n### Footnotes\n\n${normalizedFootnotes.join("\n")}\n`;
}

function restoreGitHubAlertSyntax(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const output: string[] = [];
  let activeFence: { marker: "`" | "~"; length: number } | null = null;

  for (const line of lines) {
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }

      output.push(line);
      continue;
    }

    if (activeFence) {
      output.push(line);
      continue;
    }

    const match = line.match(
      /^(\s*(?:>\s*)+)\*\*(Note|Tip|Important|Warning|Caution):\*\*(?:\s*(.*))?$/i,
    );
    if (!match || !match[1] || !match[2]) {
      output.push(line);
      continue;
    }

    const alertType = GITHUB_ALERT_TYPES_BY_LABEL.get(match[2].toLowerCase()) ??
      match[2].toUpperCase();
    const body = (match[3] ?? "").trim();
    output.push(
      body.length > 0
        ? `${match[1]}[!${alertType}] ${body}`
        : `${match[1]}[!${alertType}]`,
    );
  }

  return output.join("\n");
}

type ParsedFootnoteDefinition = {
  id: string;
  body: string;
};

function toMarkdownFootnoteDefinition(definition: ParsedFootnoteDefinition): string {
  const parts = definition.body
    .split("\n")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (parts.length === 0) {
    return `[^${definition.id}]:`;
  }

  const [head, ...tail] = parts;
  if (tail.length === 0) {
    return `[^${definition.id}]: ${head}`;
  }

  return `[^${definition.id}]: ${head}\n${tail.map((segment) => `  ${segment}`).join("\n")}`;
}

function restoreFootnoteSyntax(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  let headingIndex = -1;
  let activeFence: { marker: "`" | "~"; length: number } | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }
      continue;
    }

    if (activeFence) {
      continue;
    }

    if (line.trim().toLowerCase() === "### footnotes") {
      headingIndex = index;
    }
  }

  if (headingIndex < 0) {
    return lines.join("\n");
  }

  let definitionIndex = headingIndex + 1;
  while (definitionIndex < lines.length && (lines[definitionIndex] ?? "").trim() === "") {
    definitionIndex += 1;
  }

  const definitions: ParsedFootnoteDefinition[] = [];
  let cursor = definitionIndex;

  while (cursor < lines.length) {
    const currentLine = lines[cursor] ?? "";
    if (currentLine.trim() === "") {
      cursor += 1;
      continue;
    }

    const match = currentLine.match(
      /^\s*\d+\.\s*<a id="fn-([^"]+)"><\/a>\s+\*\*\[\^([^\]]+)\]\*\*(?:\s*(.*))?$/,
    );
    if (!match || !match[1] || !match[2]) {
      break;
    }

    const id = match[2].trim();
    if (!id) {
      break;
    }

    const expectedAnchor = normalizeFootnoteAnchorId(id);
    const actualAnchor = match[1].trim();
    if (actualAnchor !== expectedAnchor) {
      break;
    }

    const parts: string[] = [];
    const firstBody = (match[3] ?? "").trim();
    if (firstBody.length > 0) {
      parts.push(firstBody);
    }

    cursor += 1;
    while (cursor < lines.length) {
      const continuation = lines[cursor] ?? "";
      if (/^( {2,}|\t)/.test(continuation)) {
        parts.push(continuation.replace(/^( {2,}|\t)/, "").trim());
        cursor += 1;
        continue;
      }
      break;
    }

    definitions.push({
      id,
      body: parts.join("\n").trim(),
    });
  }

  if (definitions.length === 0) {
    return lines.join("\n");
  }

  const trailingNonEmpty = lines.slice(cursor).some((line) => line.trim().length > 0);
  if (trailingNonEmpty) {
    return lines.join("\n");
  }

  let sectionStart = headingIndex;
  while (sectionStart > 0 && (lines[sectionStart - 1] ?? "").trim() === "") {
    sectionStart -= 1;
  }

  if (sectionStart > 0 && (lines[sectionStart - 1] ?? "").trim() === "---") {
    sectionStart -= 1;
    while (sectionStart > 0 && (lines[sectionStart - 1] ?? "").trim() === "") {
      sectionStart -= 1;
    }
  }

  const bodyLines = lines.slice(0, sectionStart);
  while (bodyLines.length > 0 && (bodyLines[bodyLines.length - 1] ?? "").trim() === "") {
    bodyLines.pop();
  }

  const definitionIds = new Set(definitions.map((definition) => definition.id));
  const body = bodyLines.join("\n").replace(/\[\^([^\]\s]+)\]\(#fn-([a-z0-9_-]+)\)/gi, (match, rawId, rawAnchor) => {
    const id = String(rawId ?? "").trim();
    const anchor = String(rawAnchor ?? "").trim().toLowerCase();
    if (!id || !definitionIds.has(id)) {
      return match;
    }

    const expectedAnchor = normalizeFootnoteAnchorId(id);
    if (anchor !== expectedAnchor) {
      return match;
    }

    return `[^${id}]`;
  });

  const definitionMarkdown = definitions
    .map((definition) => toMarkdownFootnoteDefinition(definition))
    .join("\n");
  const normalizedBody = body.trimEnd();
  if (!normalizedBody) {
    return `${definitionMarkdown}\n`;
  }

  return `${normalizedBody}\n\n${definitionMarkdown}\n`;
}

function stripInternalAlignmentMarkers(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const filtered = lines.filter((line) => {
    const compact = normalizeAlignmentMarkerText(line);
    if (compact.length === 0) {
      return true;
    }

    if (isAlignmentEndMarker(compact)) {
      return false;
    }

    return parseAlignmentStartMarker(compact) === null;
  });

  return filtered.join("\n");
}

const MARKDOWN_IMAGE_LINE_REGEX =
  /^!\[((?:\\.|[^\]])*)\]\(([^)\s]+)(?:\s+"((?:[^"\\]|\\.)*)")?\)$/;
const MARKDOWN_LINKED_IMAGE_LINE_REGEX =
  /^\[!\[((?:\\.|[^\]])*)\]\(([^)\s]+)(?:\s+"((?:[^"\\]|\\.)*)")?\)\]\((<[^>\r\n]+>|[^)\s]+)(?:\s+"((?:[^"\\]|\\.)*)")?\)$/;

function isStandaloneMarkdownImageLine(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  return MARKDOWN_IMAGE_LINE_REGEX.test(trimmed) || MARKDOWN_LINKED_IMAGE_LINE_REGEX.test(trimmed);
}

function convertImageAlignmentCommentsToGitHubWrappers(markdown: string): string {
  const lines = normalizeMarkdownLineBreaks(markdown).split("\n");
  const output: string[] = [];
  let activeFence: { marker: "`" | "~"; length: number } | null = null;

  for (const line of lines) {
    const fence = isFenceDelimiterLine(line);
    if (fence) {
      if (
        activeFence &&
        fence.marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      } else if (!activeFence) {
        activeFence = fence;
      }

      output.push(line);
      continue;
    }

    if (activeFence) {
      output.push(line);
      continue;
    }

    const alignmentMatch = line.match(
      /^(\s*)(.*\S)\s*<!--\s*align\s*:\s*(left|center|right)\s*-->\s*$/i,
    );
    if (!alignmentMatch || !alignmentMatch[2] || !alignmentMatch[3]) {
      output.push(line);
      continue;
    }

    const indentation = alignmentMatch[1] ?? "";
    const imageLine = alignmentMatch[2].trim();
    const alignment = alignmentMatch[3].toLowerCase();
    if (
      (alignment !== "left" && alignment !== "center" && alignment !== "right") ||
      !isStandaloneMarkdownImageLine(imageLine)
    ) {
      output.push(line);
      continue;
    }

    output.push(`${indentation}<p align="${alignment}">`);
    output.push(`${indentation}${imageLine}`);
    output.push(`${indentation}</p>`);
  }

  return output.join("\n");
}

function postprocessMarkdownForBridgeExport(
  markdown: string,
  flavor: MarkdownBridgeFlavor,
  metadataMode: SourceMetadataMode | undefined,
): string {
  const withAlertSyntax = restoreGitHubAlertSyntax(markdown);
  const withFootnoteSyntax = restoreFootnoteSyntax(withAlertSyntax);
  const withoutInternalMarkers = stripInternalAlignmentMarkers(withFootnoteSyntax);
  if (flavor === "github" && metadataMode === "none") {
    return convertImageAlignmentCommentsToGitHubWrappers(withoutInternalMarkers);
  }

  return withoutInternalMarkers;
}

function extractLeadingFrontmatter(markdown: string): MarkdownFrontmatterExtraction {
  const normalized = normalizeMarkdownLineBreaks(markdown);
  const lines = normalized.split("\n");
  if (lines.length < 3) {
    return { frontmatter: null, content: normalized };
  }

  const firstLine = (lines[0] ?? "").replace(/^\uFEFF/, "");
  if (firstLine.trim() !== "---") {
    return { frontmatter: null, content: normalized };
  }

  let closingIndex = -1;
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const trimmed = (lines[lineIndex] ?? "").trim();
    if (trimmed === "---" || trimmed === "...") {
      closingIndex = lineIndex;
      break;
    }
  }

  if (closingIndex < 2) {
    return { frontmatter: null, content: normalized };
  }

  const frontmatterBody = lines.slice(1, closingIndex).join("\n");
  if (!/^[^#\n]*:/m.test(frontmatterBody)) {
    return { frontmatter: null, content: normalized };
  }

  const frontmatter = lines.slice(0, closingIndex + 1).join("\n").trim();
  const content = lines.slice(closingIndex + 1).join("\n");
  return { frontmatter, content };
}

function preprocessMarkdownForBridgeImport(markdown: string): MarkdownFrontmatterExtraction {
  const extracted = extractLeadingFrontmatter(markdown);
  const withNestedImageLinks = normalizeNestedImageLinks(extracted.content);
  const withReferenceExpansion = normalizeReferenceStyleMarkdown(withNestedImageLinks);
  const withAlertNormalization = normalizeGitHubAlertBlocks(withReferenceExpansion);
  const withMathNormalization = normalizeMathBlockSyntax(withAlertNormalization);
  const withFootnoteNormalization = normalizeFootnoteSyntax(withMathNormalization);
  return {
    frontmatter: extracted.frontmatter,
    content: withFootnoteNormalization,
  };
}

function attachFrontmatterToDocument(document: JsonDocument, frontmatter: string | null): JsonDocument {
  if (!frontmatter || !isJsonRecord(document.root)) {
    return document;
  }

  document.root.frontmatter = frontmatter;
  return document;
}

function stripFrontmatterFromDocument(input: unknown): {
  document: unknown;
  frontmatter: string | null;
} {
  if (!isJsonRecord(input) || !isJsonRecord(input.root)) {
    return {
      document: input,
      frontmatter: null,
    };
  }

  const cloned = deepClone(input);
  if (!isJsonRecord(cloned.root)) {
    return {
      document: cloned,
      frontmatter: null,
    };
  }

  const frontmatter = typeof cloned.root.frontmatter === "string"
    ? normalizeMarkdownLineBreaks(cloned.root.frontmatter).trim()
    : "";
  delete cloned.root.frontmatter;
  return {
    document: cloned,
    frontmatter: frontmatter.length > 0 ? frontmatter : null,
  };
}

function prependFrontmatterToMarkdown(markdown: string, frontmatter: string | null): string {
  if (!frontmatter) {
    return markdown;
  }

  const normalizedFrontmatter = normalizeMarkdownLineBreaks(frontmatter).trim();
  const normalizedMarkdown = normalizeMarkdownLineBreaks(markdown).trim();
  if (!normalizedMarkdown) {
    return `${normalizedFrontmatter}\n`;
  }

  return `${normalizedFrontmatter}\n\n${normalizedMarkdown}`;
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

    const singleLineContainerMatch = trimmed.match(/^<(div|p|figure)\b([^>]*)>([\s\S]*?)<\/\1>$/i);
    if (singleLineContainerMatch) {
      const alignment = extractAlignmentFromTag(trimmed);
      const innerContent = singleLineContainerMatch[3] ?? "";
      const figureCaption = extractFigureCaption(innerContent);
      if (alignment) {
        output.push(createAlignmentStartMarker(alignment));
      }
      const markdownImage = markdownImageFromHtmlTag(
        innerContent,
        alignment,
        figureCaption,
      );
      if (markdownImage) {
        output.push(markdownImage);
      } else {
        const normalizedInline = normalizeEmojiShortcodes(
          convertNestedImageLinksToMarkdownImages(
            convertSimpleInlineHtmlToMarkdown(stripFigureCaptionMarkup(innerContent)),
          ),
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

    if (/^<figure\b/i.test(trimmed)) {
      const figureLines = [line];
      while (index + 1 < lines.length) {
        index += 1;
        const nextLine = lines[index] ?? "";
        figureLines.push(nextLine);
        if (/<\/figure>/i.test(nextLine)) {
          break;
        }
      }

      const figureMarkup = figureLines.join("\n");
      const figureAlignment = extractAlignmentFromTag(figureMarkup);
      const figureCaption = extractFigureCaption(figureMarkup);
      const figureImage = markdownImageFromHtmlTag(
        figureMarkup,
        figureAlignment,
        figureCaption,
      );
      if (figureImage) {
        output.push(figureImage);
        continue;
      }

      const normalizedInline = normalizeEmojiShortcodes(
        convertNestedImageLinksToMarkdownImages(
          convertSimpleInlineHtmlToMarkdown(stripFigureCaptionMarkup(figureMarkup)),
        ),
      );
      if (normalizedInline.trim().length > 0) {
        output.push(normalizedInline);
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

    if (
      /^<source\b/i.test(trimmed) ||
      /^<\/?picture\b/i.test(trimmed) ||
      /^<\/?figcaption\b/i.test(trimmed) ||
      /^<\/?figure\b/i.test(trimmed)
    ) {
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
      const figureCaption = extractFigureCaption(innerContent);
      if (paragraphAlignment) {
        output.push(createAlignmentStartMarker(paragraphAlignment));
      }
      const markdownImage = markdownImageFromHtmlTag(
        innerContent,
        paragraphAlignment,
        figureCaption,
      );
      if (markdownImage) {
        output.push(markdownImage);
      } else {
        const normalizedInline = normalizeEmojiShortcodes(
          convertNestedImageLinksToMarkdownImages(
            convertSimpleInlineHtmlToMarkdown(stripFigureCaptionMarkup(innerContent)),
          ),
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

function createParagraphChildrenFromText(text: string): JsonRecord[] {
  if (text.length === 0) {
    return [];
  }

  const lines = text.split("\n");
  const children: JsonRecord[] = [];

  lines.forEach((line, index) => {
    if (line.length > 0) {
      children.push({
        type: "text",
        version: 1,
        text: line,
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
      });
    }

    if (index < lines.length - 1) {
      children.push({
        type: "linebreak",
        version: 1,
      });
    }
  });

  return children;
}

function normalizeAlignmentMarkerText(value: string): string {
  return value
    .trim()
    .replace(/\\+/g, "")
    .replace(/\s+/g, "");
}

function parseAlignmentStartMarker(value: string): BlockAlignment | null {
  const normalized = normalizeAlignmentMarkerText(value);
  const matches = [
    normalized.match(/^\[\[LUTHORALIGNSTART:(left|center|right|justify)\]\]$/i),
    normalized.match(/^\[\[LUTHOR_ALIGN_START:(left|center|right|justify)\]\]$/i),
    normalized.match(/^\[\[LUTHOR-ALIGN-START:(left|center|right|justify)\]\]$/i),
  ];

  for (const match of matches) {
    const alignmentValue = match?.[1]?.toLowerCase();
    if (alignmentValue && isBlockAlignment(alignmentValue)) {
      return alignmentValue;
    }
  }

  return null;
}

function isAlignmentEndMarker(value: string): boolean {
  const normalized = normalizeAlignmentMarkerText(value);
  return (
    normalized === "[[LUTHORALIGNEND]]" ||
    normalized === "[[LUTHOR_ALIGN_END]]" ||
    normalized === "[[LUTHOR-ALIGN-END]]"
  );
}

function extractAlignmentMarker(node: JsonRecord): AlignmentMarker | null {
  const text = getParagraphTextContent(node);
  if (text === null) {
    return null;
  }

  if (isAlignmentEndMarker(text)) {
    return { type: "end" };
  }

  const alignment = parseAlignmentStartMarker(text);
  if (alignment) {
    return { type: "start", alignment };
  }

  return null;
}

function consumeParagraphAlignmentMarkerLines(
  node: JsonRecord,
  alignmentStack: BlockAlignment[],
): {
  keepNode: boolean;
  consumedMarker: boolean;
  alignmentForNode: BlockAlignment | null;
} {
  const text = getParagraphTextContent(node);
  if (text === null) {
    return { keepNode: true, consumedMarker: false, alignmentForNode: null };
  }

  const sourceLines = text.split("\n");
  const keptLines: string[] = [];
  let consumedMarker = false;
  let alignmentForNode: BlockAlignment | null = null;

  for (const line of sourceLines) {
    const startAlignment = parseAlignmentStartMarker(line);
    if (startAlignment) {
      alignmentStack.push(startAlignment);
      consumedMarker = true;
      continue;
    }

    if (isAlignmentEndMarker(line)) {
      alignmentStack.pop();
      consumedMarker = true;
      continue;
    }

    if (alignmentForNode === null) {
      alignmentForNode = alignmentStack[alignmentStack.length - 1] ?? null;
    }
    keptLines.push(line);
  }

  if (!consumedMarker) {
    return { keepNode: true, consumedMarker: false, alignmentForNode };
  }

  while (keptLines.length > 0 && (keptLines[0] ?? "").trim().length === 0) {
    keptLines.shift();
  }
  while (keptLines.length > 0 && (keptLines[keptLines.length - 1] ?? "").trim().length === 0) {
    keptLines.pop();
  }

  if (keptLines.length === 0) {
    node.children = [];
    return { keepNode: false, consumedMarker: true, alignmentForNode: null };
  }

  node.children = createParagraphChildrenFromText(keptLines.join("\n"));
  return { keepNode: true, consumedMarker: true, alignmentForNode };
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

    const consumedParagraphMarkers = consumeParagraphAlignmentMarkerLines(
      child,
      alignmentStack,
    );
    if (!consumedParagraphMarkers.keepNode) {
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

    const activeAlignment =
      consumedParagraphMarkers.alignmentForNode ??
      alignmentStack[alignmentStack.length - 1];
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

function resolveMarkdownBridgeFlavor(options?: MarkdownBridgeOptions): MarkdownBridgeFlavor {
  const requestedFlavor = options?.bridgeFlavor ?? "github";
  if (requestedFlavor === "luthor") {
    return "github";
  }

  return requestedFlavor;
}

export function markdownToJSON(
  markdown: string,
  options?: MarkdownBridgeOptions,
): JsonDocument {
  const resolvedFlavor = resolveMarkdownBridgeFlavor(options);
  if (resolvedFlavor === "lexical-native") {
    const editor = createLexicalNativeMarkdownEditor();
    editor.update(
      () => {
        $convertFromMarkdownString(
          normalizeMarkdownLineBreaks(markdown),
          LEXICAL_NATIVE_MARKDOWN_TRANSFORMERS,
        );
      },
      { discrete: true },
    );
    return editor.getEditorState().toJSON() as JsonDocument;
  }

  const preserveMetadata = shouldPreserveMetadata(options?.metadataMode);
  const { content, envelopes, warnings } = preserveMetadata
    ? extractMetadataEnvelopes(markdown)
    : { content: markdown, envelopes: [], warnings: [] as string[] };

  if (preserveMetadata) {
    for (const warning of warnings) {
      console.warn(`[luthor-headless] ${warning}`);
    }
  }

  const preprocessed = preprocessMarkdownForBridgeImport(content);
  const sourceContent = preserveMetadata
    ? preprocessed.content
    : preprocessMarkdownForMetadataFreeImport(preprocessed.content);

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
  const rehydratedDocument = rehydrateDocumentFromEnvelopes(normalizedDocument, envelopes);
  return attachFrontmatterToDocument(rehydratedDocument, preprocessed.frontmatter);
}

export function jsonToMarkdown(
  input: unknown,
  options?: MarkdownBridgeOptions,
): string {
  const resolvedFlavor = resolveMarkdownBridgeFlavor(options);
  if (resolvedFlavor === "lexical-native") {
    const editor = createLexicalNativeMarkdownEditor();
    const editorState = toEditorState(editor, input);
    editor.setEditorState(editorState, { tag: "history-merge" });
    return editorState.read(() => {
      return $convertToMarkdownString(LEXICAL_NATIVE_MARKDOWN_TRANSFORMERS);
    });
  }

  const { document: inputWithoutFrontmatter, frontmatter } = stripFrontmatterFromDocument(input);
  const preserveMetadata = shouldPreserveMetadata(options?.metadataMode);
  const prepared = prepareDocumentForBridge(inputWithoutFrontmatter, {
    mode: "markdown",
    supportedNodeTypes: MARKDOWN_SUPPORTED_NODE_TYPES,
  });
  const partialEnvelopes = preserveMetadata
    ? collectMarkdownPartialEnvelopes(inputWithoutFrontmatter)
    : [];
  const editor = createMarkdownEditor();
  const editorState = toEditorState(editor, prepared.document);
  editor.setEditorState(editorState, { tag: "history-merge" });

  const markdown = editorState.read(() => {
    return $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
  });
  const postprocessedMarkdown = postprocessMarkdownForBridgeExport(
    markdown,
    resolvedFlavor,
    options?.metadataMode,
  );

  if (!preserveMetadata) {
    return prependFrontmatterToMarkdown(postprocessedMarkdown, frontmatter);
  }

  const withMetadata = appendMetadataEnvelopes(postprocessedMarkdown, [
    ...prepared.envelopes,
    ...partialEnvelopes,
  ]);
  return prependFrontmatterToMarkdown(withMetadata, frontmatter);
}
