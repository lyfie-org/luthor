type JsonTextNode = {
  type: "text";
  version: 1;
  text: string;
  detail: 0;
  format: 0;
  mode: "normal";
  style: "";
};

type JsonParagraphNode = {
  type: "paragraph";
  version: 1;
  format: "";
  indent: 0;
  direction: null;
  children: JsonTextNode[];
};

type JsonRootNode = {
  type: "root";
  version: 1;
  format: "";
  indent: 0;
  direction: null;
  children: JsonParagraphNode[];
};

export type JsonDocument = {
  root: JsonRootNode;
};

function createTextNode(text: string): JsonTextNode {
  return {
    type: "text",
    version: 1,
    text,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
  };
}

function createParagraphNode(text: string): JsonParagraphNode {
  return {
    type: "paragraph",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [createTextNode(text)],
  };
}

export function markdownToJSON(markdown: string): JsonDocument {
  const normalized = markdown.replace(/\r\n?/g, "\n").trim();
  const blocks = normalized.length === 0
    ? [""]
    : normalized.split(/\n{2,}/).map((block) => block.trim());

  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: null,
      children: blocks.map((block) => createParagraphNode(block)),
    },
  };
}

function extractNodeText(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  if ("text" in node && typeof (node as { text?: unknown }).text === "string") {
    return (node as { text: string }).text;
  }

  if ("children" in node && Array.isArray((node as { children?: unknown[] }).children)) {
    return ((node as { children: unknown[] }).children ?? [])
      .map((child) => extractNodeText(child))
      .join("");
  }

  return "";
}

export function jsonToMarkdown(input: unknown): string {
  if (!input || typeof input !== "object") {
    return "";
  }

  const root = (input as { root?: { children?: unknown[] } }).root;
  if (!root || !Array.isArray(root.children)) {
    return "";
  }

  return root.children
    .map((child) => extractNodeText(child).trim())
    .filter((line) => line.length > 0)
    .join("\n\n");
}
