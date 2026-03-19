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

  const editor = createMarkdownEditor();
  editor.update(
    () => {
      $convertFromMarkdownString(content, MARKDOWN_TRANSFORMERS);
    },
    { discrete: true },
  );

  const baseDocument = editor.getEditorState().toJSON() as JsonDocument;
  return rehydrateDocumentFromEnvelopes(baseDocument, envelopes);
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
