/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function decodeMarkdownWhitespaceEntities(input: string): string {
  return input.replace(/&#(9|10|13|32|160);/g, (_match, code) => {
    switch (code) {
      case "9":
        return "\t";
      case "10":
        return "\n";
      case "13":
        return "\r";
      case "32":
        return " ";
      case "160":
        return " ";
      default:
        return _match;
    }
  });
}

function moveWhitespaceOutsideMarker(input: string, marker: string): string {
  const escaped = marker.replace(/([*~])/g, "\\$1");

  let output = input;
  // Move leading whitespace outside markers: ** text** ->  **text**
  output = output.replace(
    new RegExp(`${escaped}(\\s+)([^\\n]+?)${escaped}`, "g"),
    (_match, leading, content) => `${leading}${marker}${content}${marker}`,
  );
  // Move trailing whitespace outside markers: **text ** -> **text** 
  output = output.replace(
    new RegExp(`${escaped}([^\\n]+?)(\\s+)${escaped}`, "g"),
    (_match, content, trailing) => `${marker}${content}${marker}${trailing}`,
  );

  return output;
}

function normalizeInlineMarkdownWhitespace(input: string): string {
  const markers = ["***", "**", "~~", "*"];
  return markers.reduce((value, marker) => moveWhitespaceOutsideMarker(value, marker), input);
}

const VOID_HTML_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const RAW_TEXT_TAGS = new Set(["pre", "script", "style", "textarea"]);

const BLOCK_HTML_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "details",
  "dialog",
  "div",
  "dl",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "menu",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

function isHTMLElement(node: Node): node is HTMLElement {
  return node.nodeType === ELEMENT_NODE;
}

function isMeaningfulTextNode(node: Node): boolean {
  return node.nodeType === TEXT_NODE && (node.textContent ?? "").trim().length > 0;
}

function getTagName(node: HTMLElement): string {
  return node.tagName.toLowerCase();
}

function getSignificantChildren(node: HTMLElement): Node[] {
  return Array.from(node.childNodes).filter((child) => {
    if (child.nodeType !== TEXT_NODE) {
      return true;
    }

    return isMeaningfulTextNode(child);
  });
}

function getOpeningTag(node: HTMLElement): string {
  const outerHTML = node.outerHTML;
  const firstClosingBracket = outerHTML.indexOf(">");
  if (firstClosingBracket === -1) {
    return `<${getTagName(node)}>`;
  }

  return outerHTML.slice(0, firstClosingBracket + 1);
}

function shouldFormatMultiline(node: HTMLElement): boolean {
  const tagName = getTagName(node);
  if (VOID_HTML_TAGS.has(tagName) || RAW_TEXT_TAGS.has(tagName)) {
    return false;
  }

  const children = getSignificantChildren(node);
  if (children.length === 0) {
    return false;
  }

  if (children.some(isMeaningfulTextNode)) {
    return false;
  }

  const childElements = children.filter(isHTMLElement);
  if (childElements.length === 0) {
    return false;
  }

  return childElements.every((child) => BLOCK_HTML_TAGS.has(getTagName(child)));
}

function formatHTMLNode(node: Node, depth: number): string | null {
  const pad = "  ".repeat(Math.max(depth, 0));

  if (node.nodeType === COMMENT_NODE) {
    return `${pad}<!--${(node as Comment).data}-->`;
  }

  if (node.nodeType === TEXT_NODE) {
    const value = normalizeLineBreaks(node.textContent ?? "");
    if (!value.trim()) {
      return null;
    }
    return `${pad}${value.trim()}`;
  }

  if (!isHTMLElement(node)) {
    return null;
  }

  if (!shouldFormatMultiline(node)) {
    return `${pad}${node.outerHTML}`;
  }

  const tagName = getTagName(node);
  const lines: string[] = [`${pad}${getOpeningTag(node)}`];
  for (const child of getSignificantChildren(node)) {
    const formattedChild = formatHTMLNode(child, depth + 1);
    if (formattedChild) {
      lines.push(formattedChild);
    }
  }
  lines.push(`${pad}</${tagName}>`);
  return lines.join("\n");
}

function prettyPrintHTML(input: string): string {
  if (typeof DOMParser === "undefined") {
    return input;
  }

  const parsedDocument = new DOMParser().parseFromString(input, "text/html");
  const rootNodes = Array.from(parsedDocument.body.childNodes).filter((node) => {
    if (node.nodeType !== TEXT_NODE) {
      return true;
    }

    return isMeaningfulTextNode(node);
  });

  const formatted = rootNodes
    .map((node) => formatHTMLNode(node, 0))
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (formatted.length === 0) {
    return parsedDocument.body.innerHTML.trim() || input;
  }

  return formatted.join("\n");
}

export function formatJSONSource(input: string): string {
  const normalized = normalizeLineBreaks(input).trim();
  if (!normalized) {
    return "";
  }

  try {
    const parsed = JSON.parse(normalized);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return normalized;
  }
}

export function formatMarkdownSource(input: string): string {
  return normalizeInlineMarkdownWhitespace(decodeMarkdownWhitespaceEntities(normalizeLineBreaks(input))).trim();
}

export function formatHTMLSource(input: string): string {
  const normalized = normalizeLineBreaks(input).trim();
  if (!normalized) {
    return "";
  }

  try {
    return prettyPrintHTML(normalized);
  } catch {
    return normalized;
  }
}
