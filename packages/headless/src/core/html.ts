import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { QuoteNode, HeadingNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  createEditor,
  $getRoot,
  ParagraphNode,
  TextNode,
  LineBreakNode,
  TabNode,
  type EditorState,
} from "lexical";
import { ImageNode, IframeEmbedNode, YouTubeEmbedNode } from "@lyfie/luthor-headless/extensions/media";
import {
  appendMetadataEnvelopes,
  collectSupportedNodeMetadataPatches,
  extractMetadataEnvelopes,
  prepareDocumentForBridge,
  rehydrateDocumentFromEnvelopes,
  type JsonDocument,
  type MetadataEnvelope,
} from "./metadata-envelope";
import type { SourceMetadataMode } from "./markdown";

export interface HtmlBridgeOptions {
  metadataMode?: SourceMetadataMode;
}

const HTML_SUPPORTED_NODE_TYPES = new Set<string>([
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

const HTML_NATIVE_KEYS: Readonly<Record<string, ReadonlySet<string>>> = {
  root: new Set(["type", "version", "format", "indent", "direction", "children"]),
  paragraph: new Set(["type", "version", "format", "indent", "direction", "children"]),
  text: new Set(["type", "version", "text", "detail", "format", "mode", "style"]),
  linebreak: new Set(["type", "version"]),
  tab: new Set(["type", "version"]),
  heading: new Set(["type", "version", "tag", "format", "indent", "direction", "children"]),
  quote: new Set(["type", "version", "format", "indent", "direction", "children"]),
  list: new Set(["type", "version", "listType", "start", "tag", "format", "indent", "direction", "style", "children"]),
  listitem: new Set(["type", "version", "value", "checked", "format", "indent", "direction", "style", "children"]),
  link: new Set(["type", "version", "url", "target", "rel", "title", "children"]),
  autolink: new Set(["type", "version", "url", "target", "rel", "title", "isUnlinked", "children"]),
  code: new Set(["type", "version", "language", "format", "indent", "direction", "children"]),
  "code-highlight": new Set(["type", "version", "text", "highlightType"]),
  horizontalrule: new Set(["type", "version"]),
  image: new Set(["type", "version", "src", "alt", "caption", "alignment", "className", "style", "width", "height"]),
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
    "colSpan",
    "rowSpan",
    "width",
    "backgroundColor",
    "verticalAlign",
    "children",
  ]),
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
    case "uploading":
      return value === false || value === undefined;
    default:
      return false;
  }
}

function extractHTMLPatch(node: JsonRecord, type: string): JsonRecord | null {
  const nativeKeys = HTML_NATIVE_KEYS[type];
  if (!nativeKeys) {
    return null;
  }

  const patch: JsonRecord = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "children" || key === "type") {
      continue;
    }

    if (nativeKeys.has(key)) {
      continue;
    }

    if (value === undefined) {
      continue;
    }

    if (isDefaultExtraValue(key, value)) {
      continue;
    }

    patch[key] = deepClone(value);
  }

  return hasOwnEntries(patch) ? patch : null;
}

function collectHTMLPartialEnvelopes(input: unknown): MetadataEnvelope[] {
  return collectSupportedNodeMetadataPatches(input, {
    mode: "html",
    supportedNodeTypes: HTML_SUPPORTED_NODE_TYPES,
    extractPatch: ({ node, type }) => extractHTMLPatch(node, type),
  });
}

const RAW_TEXT_TAGS = new Set(["pre", "script", "style", "textarea"]);

function createHTMLEditor() {
  return createEditor({
    namespace: "luthor-html-converter",
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

function toEditorState(editor: ReturnType<typeof createHTMLEditor>, input: unknown): EditorState {
  const serialized = typeof input === "string" ? input : JSON.stringify(input ?? {});
  return editor.parseEditorState(serialized);
}

function assertDOMSupport(): void {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof DOMParser === "undefined"
  ) {
    throw new Error(
      "HTML conversion requires browser DOM APIs (document/window/DOMParser).",
    );
  }
}

function hasWhitespacePreservingStyle(element: Element | null): boolean {
  if (!element) {
    return false;
  }

  const style = element.getAttribute("style");
  if (!style) {
    return false;
  }

  return /\bwhite-space\s*:\s*(pre|pre-wrap|pre-line)\b/i.test(style);
}

function isInsideRawTextContext(node: Node): boolean {
  let current = node.parentElement;
  while (current) {
    if (RAW_TEXT_TAGS.has(current.tagName.toLowerCase())) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function findAdjacentSignificantSibling(
  node: Text,
  direction: "previous" | "next",
): Node | null {
  let sibling = direction === "previous" ? node.previousSibling : node.nextSibling;
  while (sibling) {
    if (sibling.nodeType !== Node.TEXT_NODE) {
      return sibling;
    }

    const text = sibling.textContent ?? "";
    if (text.trim().length > 0) {
      return sibling;
    }

    sibling = direction === "previous" ? sibling.previousSibling : sibling.nextSibling;
  }

  return null;
}

function shouldCollapseToSingleSpace(previousText: string, nextText: string): boolean {
  if (!previousText || !nextText) {
    return false;
  }

  if (/\s$/.test(previousText) || /^\s/.test(nextText)) {
    return false;
  }

  const previousChar = previousText.at(-1) ?? "";
  const nextChar = nextText[0] ?? "";

  if (!previousChar || !nextChar) {
    return false;
  }

  if (/^[,.;:!?)]$/.test(nextChar) || /^[([{"']$/.test(previousChar)) {
    return false;
  }

  return true;
}

type BlockAlignment = "left" | "center" | "right" | "justify";

const ALIGNABLE_TEXT_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "li",
  "td",
  "th",
  "pre",
  "code",
]);

const ALIGN_CONTAINER_TAGS = new Set([
  "div",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "aside",
  "nav",
]);

function isBlockAlignment(value: string): value is BlockAlignment {
  return value === "left" || value === "center" || value === "right" || value === "justify";
}

function appendInlineStyle(element: HTMLElement, declaration: string): void {
  const currentStyle = element.getAttribute("style")?.trim() ?? "";
  if (!currentStyle) {
    element.setAttribute("style", declaration);
    return;
  }

  const styleWithTerminator = currentStyle.endsWith(";") ? currentStyle : `${currentStyle};`;
  element.setAttribute("style", `${styleWithTerminator} ${declaration}`);
}

function applyImageAlignmentStyle(element: HTMLElement, alignment: BlockAlignment): void {
  if (alignment === "center") {
    appendInlineStyle(element, "display:block; margin-left:auto; margin-right:auto;");
    return;
  }

  if (alignment === "left" || alignment === "right") {
    appendInlineStyle(element, `float:${alignment};`);
    return;
  }
}

function normalizeAlignmentAttributes(parsedDocument: Document): void {
  const alignCandidates = Array.from(parsedDocument.querySelectorAll<HTMLElement>("[align]"));
  for (const element of alignCandidates) {
    const alignValue = element.getAttribute("align")?.trim().toLowerCase() ?? "";
    if (!isBlockAlignment(alignValue)) {
      continue;
    }

    const tagName = element.tagName.toLowerCase();
    if (tagName === "img") {
      applyImageAlignmentStyle(element, alignValue);
      element.removeAttribute("align");
      continue;
    }

    appendInlineStyle(element, `text-align:${alignValue};`);

    if (ALIGN_CONTAINER_TAGS.has(tagName)) {
      for (const child of Array.from(element.children)) {
        if (!(child instanceof HTMLElement)) {
          continue;
        }

        const childTag = child.tagName.toLowerCase();
        if (ALIGNABLE_TEXT_TAGS.has(childTag)) {
          appendInlineStyle(child, `text-align:${alignValue};`);
          continue;
        }

        if (childTag === "img") {
          applyImageAlignmentStyle(child, alignValue);
        }
      }
    }

    element.removeAttribute("align");
  }
}

function flattenPictureElements(parsedDocument: Document): void {
  const pictures = Array.from(parsedDocument.querySelectorAll("picture"));
  for (const picture of pictures) {
    const fallbackImage = picture.querySelector("img");
    if (!fallbackImage) {
      picture.remove();
      continue;
    }

    picture.replaceWith(fallbackImage.cloneNode(true));
  }
}

function normalizeWhitespaceArtifacts(parsedDocument: Document): void {
  const preWrapCandidates = Array.from(parsedDocument.querySelectorAll<HTMLElement>("[style]"));
  for (const element of preWrapCandidates) {
    if (!hasWhitespacePreservingStyle(element)) {
      continue;
    }

    if (element.childNodes.length !== 1 || element.firstChild?.nodeType !== Node.TEXT_NODE) {
      continue;
    }

    const textNode = element.firstChild as Text;
    if (!/[\r\n]/.test(textNode.data)) {
      continue;
    }

    textNode.data = textNode.data
      .replace(/^\s*\r?\n\s*/, "")
      .replace(/\r?\n\s*$/, "");
  }

  const walker = parsedDocument.createTreeWalker(parsedDocument.body, NodeFilter.SHOW_TEXT);
  const adjustments: Array<{ node: Text; replacement: string | null }> = [];
  let current = walker.nextNode();

  while (current) {
    const textNode = current as Text;
    const value = textNode.data;
    const parentElement = textNode.parentElement;

    if (
      !/^[\s\r\n\t]+$/.test(value) ||
      !/[\r\n]/.test(value) ||
      isInsideRawTextContext(textNode) ||
      hasWhitespacePreservingStyle(parentElement)
    ) {
      current = walker.nextNode();
      continue;
    }

    const previousSibling = findAdjacentSignificantSibling(textNode, "previous");
    const nextSibling = findAdjacentSignificantSibling(textNode, "next");
    const previousText = previousSibling?.textContent ?? "";
    const nextText = nextSibling?.textContent ?? "";

    if (shouldCollapseToSingleSpace(previousText, nextText)) {
      adjustments.push({ node: textNode, replacement: " " });
    } else {
      adjustments.push({ node: textNode, replacement: null });
    }

    current = walker.nextNode();
  }

  for (const adjustment of adjustments) {
    if (!adjustment.node.parentNode) {
      continue;
    }

    if (adjustment.replacement === null) {
      adjustment.node.parentNode.removeChild(adjustment.node);
      continue;
    }

    adjustment.node.data = adjustment.replacement;
  }
}

function shouldPreserveMetadata(metadataMode: SourceMetadataMode | undefined): boolean {
  return metadataMode !== "none";
}

export function htmlToJSON(
  html: string,
  options?: HtmlBridgeOptions,
): JsonDocument {
  assertDOMSupport();
  const preserveMetadata = shouldPreserveMetadata(options?.metadataMode);
  const { content, envelopes, warnings } = preserveMetadata
    ? extractMetadataEnvelopes(html)
    : { content: html, envelopes: [], warnings: [] as string[] };

  if (preserveMetadata) {
    for (const warning of warnings) {
      console.warn(`[luthor-headless] ${warning}`);
    }
  }

  const editor = createHTMLEditor();
  editor.update(
    () => {
      const parsedDocument = new DOMParser().parseFromString(content, "text/html");
      flattenPictureElements(parsedDocument);
      normalizeAlignmentAttributes(parsedDocument);
      normalizeWhitespaceArtifacts(parsedDocument);
      const nodes = $generateNodesFromDOM(editor, parsedDocument);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    },
    { discrete: true },
  );

  const baseDocument = editor.getEditorState().toJSON() as JsonDocument;
  return rehydrateDocumentFromEnvelopes(baseDocument, envelopes);
}

export function jsonToHTML(
  input: unknown,
  options?: HtmlBridgeOptions,
): string {
  assertDOMSupport();
  const preserveMetadata = shouldPreserveMetadata(options?.metadataMode);
  const prepared = prepareDocumentForBridge(input, {
    mode: "html",
    supportedNodeTypes: HTML_SUPPORTED_NODE_TYPES,
  });
  const partialEnvelopes = preserveMetadata ? collectHTMLPartialEnvelopes(input) : [];
  const editor = createHTMLEditor();
  const editorState = toEditorState(editor, prepared.document);
  editor.setEditorState(editorState, { tag: "history-merge" });

  const html = editorState.read(() => {
    return $generateHtmlFromNodes(editor, null);
  });

  if (!preserveMetadata) {
    return html;
  }

  return appendMetadataEnvelopes(html, [...prepared.envelopes, ...partialEnvelopes]);
}
