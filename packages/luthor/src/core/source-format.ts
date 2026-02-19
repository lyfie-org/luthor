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

const WHITESPACE_PRESERVE_TAGS = new Set(["pre", "code", "textarea", "script", "style"]);

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function serializeAttributes(element: Element): string {
  if (element.attributes.length === 0) {
    return "";
  }

  return Array.from(element.attributes)
    .map((attribute) => {
      const escapedValue = attribute.value.replace(/"/g, "&quot;");
      return ` ${attribute.name}="${escapedValue}"`;
    })
    .join("");
}

function formatTextNode(rawText: string, indent: string, preserveWhitespace: boolean): string[] {
  const normalized = normalizeLineBreaks(rawText);

  if (preserveWhitespace) {
    return normalized
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => `${indent}${line}`);
  }

  const collapsed = normalized.replace(/\s+/g, " ").trim();
  return collapsed ? [`${indent}${collapsed}`] : [];
}

function formatNode(node: ChildNode, depth: number, preserveWhitespace = false): string[] {
  const indent = "  ".repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    return formatTextNode(node.textContent ?? "", indent, preserveWhitespace);
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    const comment = (node as Comment).data.trim();
    if (!comment) {
      return [];
    }
    return [`${indent}<!--${comment}-->`];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  const attributes = serializeAttributes(element);
  const openingTag = `${indent}<${tagName}${attributes}>`;

  if (VOID_HTML_TAGS.has(tagName)) {
    return [openingTag];
  }

  const childPreserveWhitespace = preserveWhitespace || WHITESPACE_PRESERVE_TAGS.has(tagName);
  const children = Array.from(element.childNodes);

  if (children.length === 0) {
    return [`${openingTag}</${tagName}>`];
  }

  const firstChild = children[0];
  if (!childPreserveWhitespace && children.length === 1 && firstChild && firstChild.nodeType === Node.TEXT_NODE) {
    const singleLineText = (firstChild.textContent ?? "").replace(/\s+/g, " ").trim();
    if (singleLineText) {
      return [`${openingTag.slice(0, -1)}>${singleLineText}</${tagName}>`];
    }
  }

  const formattedChildren = children.flatMap((child) => formatNode(child, depth + 1, childPreserveWhitespace));

  if (formattedChildren.length === 0) {
    return [`${openingTag}</${tagName}>`];
  }

  return [openingTag, ...formattedChildren, `${indent}</${tagName}>`];
}

export function formatHTMLSource(input: string): string {
  const normalized = normalizeLineBreaks(input).trim();
  if (!normalized) {
    return "";
  }

  if (typeof document === "undefined") {
    return normalized;
  }

  const template = document.createElement("template");
  template.innerHTML = normalized;

  const lines = Array.from(template.content.childNodes).flatMap((node) => formatNode(node, 0));
  return lines.join("\n").trim();
}

export function formatMarkdownSource(input: string): string {
  const normalized = normalizeLineBreaks(input);
  const withoutTrailingSpaces = normalized
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");

  return withoutTrailingSpaces.trim();
}

export function formatJSONBSource(input: string): string {
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
