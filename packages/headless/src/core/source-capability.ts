import {
  IS_BOLD,
  IS_CODE,
  IS_HIGHLIGHT,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_UNDERLINE,
} from "lexical";

export type BridgeSourceMode = "markdown" | "html";
export type JsonRecord = Record<string, unknown>;

type BridgeRepresentabilityContext = {
  node?: JsonRecord;
};

const SUPPORTED_NODE_TYPES = [
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
] as const;

export const MARKDOWN_SUPPORTED_NODE_TYPES = new Set<string>(SUPPORTED_NODE_TYPES);
export const HTML_SUPPORTED_NODE_TYPES = new Set<string>(SUPPORTED_NODE_TYPES);

export const MARKDOWN_TEXT_NATIVE_FORMAT_MASK =
  IS_BOLD |
  IS_ITALIC |
  IS_STRIKETHROUGH |
  IS_CODE |
  IS_HIGHLIGHT |
  IS_UNDERLINE;

export const MARKDOWN_NATIVE_KEY_MAP: Readonly<Record<string, ReadonlySet<string>>> = {
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

export const HTML_NATIVE_KEY_MAP: Readonly<Record<string, ReadonlySet<string>>> = {
  root: new Set(["type", "version", "format", "indent", "direction", "children"]),
  paragraph: new Set([
    "type",
    "version",
    "format",
    "indent",
    "direction",
    "textFormat",
    "textStyle",
    "children",
  ]),
  text: new Set(["type", "version", "text", "detail", "format", "mode", "style"]),
  linebreak: new Set(["type", "version"]),
  tab: new Set(["type", "version"]),
  heading: new Set([
    "type",
    "version",
    "tag",
    "format",
    "indent",
    "direction",
    "textFormat",
    "textStyle",
    "children",
  ]),
  quote: new Set([
    "type",
    "version",
    "format",
    "indent",
    "direction",
    "textFormat",
    "textStyle",
    "children",
  ]),
  list: new Set([
    "type",
    "version",
    "listType",
    "start",
    "tag",
    "format",
    "indent",
    "direction",
    "textFormat",
    "textStyle",
    "style",
    "children",
  ]),
  listitem: new Set([
    "type",
    "version",
    "value",
    "checked",
    "format",
    "indent",
    "direction",
    "textFormat",
    "textStyle",
    "style",
    "children",
  ]),
  link: new Set(["type", "version", "url", "target", "rel", "title", "children"]),
  autolink: new Set(["type", "version", "url", "target", "rel", "title", "isUnlinked", "children"]),
  code: new Set([
    "type",
    "version",
    "language",
    "format",
    "indent",
    "direction",
    "textFormat",
    "textStyle",
    "children",
  ]),
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
    "className",
    "style",
    "width",
    "height",
  ]),
  "iframe-embed": new Set(["type", "version", "src", "width", "height", "alignment", "title", "caption"]),
  "youtube-embed": new Set(["type", "version", "src", "width", "height", "alignment", "caption", "start"]),
  table: new Set([
    "type",
    "version",
    "format",
    "indent",
    "direction",
    "children",
    "rowStriping",
    "frozenColumnCount",
    "frozenRowCount",
    "colWidths",
    "style",
  ]),
  tablerow: new Set(["type", "version", "height", "children"]),
  tablecell: new Set([
    "type",
    "version",
    "headerState",
    "format",
    "colSpan",
    "rowSpan",
    "width",
    "backgroundColor",
    "verticalAlign",
    "children",
  ]),
};

export function isDefaultBridgeValue(_type: string, key: string, value: unknown): boolean {
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
    case "target":
    case "rel":
    case "title":
    case "linkHref":
    case "linkTitle":
      return value === "" || value === null || value === undefined;
    case "isUnlinked":
      return value === false || value === undefined;
    case "headerState":
      return value === 0;
    case "className":
      return value === "" || value === null || value === undefined;
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
    default:
      return false;
  }
}

function isDefaultMarkdownBridgeValue(type: string, key: string, value: unknown): boolean {
  if (isDefaultBridgeValue(type, key, value)) {
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

function isMarkdownDerivedRepresentable(
  type: string,
  key: string,
  value: unknown,
  context?: BridgeRepresentabilityContext,
): boolean {
  if (type === "list" && key === "tag") {
    const listType = typeof context?.node?.listType === "string" ? context.node.listType : "";
    if (listType === "number") {
      return value === "ol";
    }
    if (listType === "bullet" || listType === "check") {
      return value === "ul";
    }
  }

  return false;
}

export function isMarkdownRepresentable(
  type: string,
  key: string,
  value: unknown,
  context?: BridgeRepresentabilityContext,
): boolean {
  const nativeKeys = MARKDOWN_NATIVE_KEY_MAP[type];
  if (!nativeKeys) {
    return false;
  }

  if (type === "text" && key === "format" && typeof value === "number") {
    return (value & ~MARKDOWN_TEXT_NATIVE_FORMAT_MASK) === 0;
  }

  if (nativeKeys.has(key)) {
    return true;
  }

  if (isMarkdownDerivedRepresentable(type, key, value, context)) {
    return true;
  }

  return isDefaultMarkdownBridgeValue(type, key, value);
}

export function isHTMLRepresentable(
  type: string,
  key: string,
  value: unknown,
): boolean {
  const nativeKeys = HTML_NATIVE_KEY_MAP[type];
  if (!nativeKeys) {
    return false;
  }

  if (nativeKeys.has(key)) {
    return true;
  }

  return isDefaultBridgeValue(type, key, value);
}

function deepClone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function hasOwnEntries(record: JsonRecord): boolean {
  return Object.keys(record).length > 0;
}

function extractBridgeMetadataPatch(
  mode: BridgeSourceMode,
  node: JsonRecord,
  type: string,
): JsonRecord | null {
  const patch: JsonRecord = {};

  for (const [key, value] of Object.entries(node)) {
    if (key === "children" || key === "type") {
      continue;
    }

    if (value === undefined) {
      continue;
    }

    if (mode === "markdown" && type === "text" && key === "format" && typeof value === "number") {
      const extraBits = value & ~MARKDOWN_TEXT_NATIVE_FORMAT_MASK;
      if (extraBits !== 0) {
        patch.__luthorTextFormatExtra = extraBits;
      }
      continue;
    }

    const representable = mode === "markdown"
      ? isMarkdownRepresentable(type, key, value, { node })
      : isHTMLRepresentable(type, key, value);

    if (representable) {
      continue;
    }

    patch[key] = deepClone(value);
  }

  return hasOwnEntries(patch) ? patch : null;
}

export function extractMarkdownMetadataPatch(
  node: JsonRecord,
  type: string,
): JsonRecord | null {
  return extractBridgeMetadataPatch("markdown", node, type);
}

export function extractHTMLMetadataPatch(
  node: JsonRecord,
  type: string,
): JsonRecord | null {
  return extractBridgeMetadataPatch("html", node, type);
}
