const ENVELOPE_PREFIX = "luthor:meta";
const ENVELOPE_VERSION = 1;
const ENVELOPE_REGEX = /<!--\s*luthor:meta\s+v(\d+)\s+({[\s\S]*?})\s*-->/g;

type JsonRecord = Record<string, unknown>;

export type JsonDocument = {
  root: JsonRecord;
};

export type BridgeMode = "markdown" | "html";

export type MetadataEnvelope = {
  id: string;
  type: string;
  path: number[];
  node: JsonRecord;
  fallback: string;
  strategy?: "replace" | "merge";
};

export type PreparedBridgeDocument = {
  document: JsonDocument;
  envelopes: MetadataEnvelope[];
};

export type ExtractedMetadataEnvelopes = {
  content: string;
  envelopes: MetadataEnvelope[];
  warnings: string[];
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function createTextNode(text: string): JsonRecord {
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

function createParagraphNode(text: string): JsonRecord {
  return {
    type: "paragraph",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [createTextNode(text)],
  };
}

function createListItemNode(text: string): JsonRecord {
  return {
    type: "listitem",
    version: 1,
    value: 1,
    checked: null,
    indent: 0,
    direction: null,
    format: "",
    children: [createTextNode(text)],
  };
}

function createFallbackLabel(mode: BridgeMode, type: string): string {
  return `[Unsupported ${type} preserved in ${mode} metadata]`;
}

function createEnvelopeId(type: string, path: readonly number[], sequence: number): string {
  const anchor = path.length > 0 ? path.join(".") : "root";
  return `${type}:${anchor}:${sequence}`;
}

function createFallbackNode(parentType: string, fallbackLabel: string): JsonRecord {
  if (parentType === "root" || parentType === "quote") {
    return createParagraphNode(fallbackLabel);
  }

  if (parentType === "list") {
    return createListItemNode(fallbackLabel);
  }

  if (
    parentType === "paragraph" ||
    parentType === "heading" ||
    parentType === "listitem" ||
    parentType === "link" ||
    parentType === "autolink" ||
    parentType === "code" ||
    parentType === "code-highlight"
  ) {
    return createTextNode(fallbackLabel);
  }

  return createParagraphNode(fallbackLabel);
}

function sanitizeChildren(
  children: unknown[],
  parentType: string,
  parentPath: readonly number[],
  mode: BridgeMode,
  supportedNodeTypes: ReadonlySet<string>,
  envelopes: MetadataEnvelope[],
): JsonRecord[] {
  const sanitized: JsonRecord[] = [];

  for (const [index, child] of children.entries()) {
    if (!isRecord(child)) {
      continue;
    }

    const path = [...parentPath, index];
    const type = typeof child.type === "string" ? child.type : "";
    if (!supportedNodeTypes.has(type)) {
      const fallback = createFallbackLabel(mode, type || "node");
      const envelope: MetadataEnvelope = {
        id: createEnvelopeId(type || "node", path, envelopes.length + 1),
        type: type || "node",
        path,
        node: deepClone(child),
        fallback,
      };
      envelopes.push(envelope);
      sanitized.push(createFallbackNode(parentType, fallback));
      continue;
    }

    const nextNode: JsonRecord = { ...child };
    if (Array.isArray(child.children)) {
      nextNode.children = sanitizeChildren(
        child.children,
        type,
        path,
        mode,
        supportedNodeTypes,
        envelopes,
      );
    }
    sanitized.push(nextNode);
  }

  return sanitized;
}

function createEmptyRoot(): JsonRecord {
  return {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [createParagraphNode("")],
  };
}

function normalizeDocument(input: unknown): JsonDocument {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;
  if (!isRecord(parsed) || !isRecord(parsed.root)) {
    return { root: createEmptyRoot() };
  }

  const root = parsed.root;
  const rootChildren = Array.isArray(root.children) ? root.children : [];

  return {
    root: {
      ...root,
      type: "root",
      children: rootChildren,
    },
  };
}

function replaceNodeAtPath(root: JsonRecord, path: readonly number[], node: JsonRecord): boolean {
  if (path.length === 0) {
    return false;
  }

  let current: JsonRecord = root;
  for (const index of path.slice(0, -1)) {
    if (!Array.isArray(current.children) || index < 0 || index >= current.children.length) {
      return false;
    }

    const next = current.children[index];
    if (!isRecord(next)) {
      return false;
    }
    current = next;
  }

  const leafIndex = path[path.length - 1];
  if (typeof leafIndex !== "number" || !Array.isArray(current.children) || leafIndex < 0) {
    return false;
  }

  if (leafIndex < current.children.length) {
    current.children[leafIndex] = deepClone(node);
    return true;
  }

  if (leafIndex === current.children.length) {
    current.children.push(deepClone(node));
    return true;
  }

  return false;
}

function getNodeAtPath(root: JsonRecord, path: readonly number[]): JsonRecord | null {
  if (path.length === 0) {
    return root;
  }

  let current: JsonRecord = root;
  for (const index of path) {
    if (!Array.isArray(current.children) || index < 0 || index >= current.children.length) {
      return null;
    }

    const next = current.children[index];
    if (!isRecord(next)) {
      return null;
    }

    current = next;
  }

  return current;
}

function mergeRecord(target: JsonRecord, patch: JsonRecord): void {
  for (const [key, value] of Object.entries(patch)) {
    if (key === "__luthorTextFormatExtra") {
      const extra = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(extra) || extra === 0) {
        continue;
      }

      const currentFormat =
        typeof target.format === "number" ? target.format : Number(target.format ?? 0);
      target.format = Number.isFinite(currentFormat)
        ? currentFormat | extra
        : extra;
      continue;
    }

    if (isRecord(value) && isRecord(target[key])) {
      mergeRecord(target[key] as JsonRecord, value);
      continue;
    }

    target[key] = deepClone(value);
  }
}

function mergeNodeAtPath(root: JsonRecord, path: readonly number[], patch: JsonRecord): boolean {
  const target = getNodeAtPath(root, path);
  if (!target) {
    return false;
  }

  mergeRecord(target, patch);
  return true;
}

export function prepareDocumentForBridge(
  input: unknown,
  options: {
    mode: BridgeMode;
    supportedNodeTypes: ReadonlySet<string>;
  },
): PreparedBridgeDocument {
  const baseDocument = normalizeDocument(input);
  const rootChildren = Array.isArray(baseDocument.root.children) ? baseDocument.root.children : [];
  const envelopes: MetadataEnvelope[] = [];
  const sanitizedChildren = sanitizeChildren(
    rootChildren,
    "root",
    [],
    options.mode,
    options.supportedNodeTypes,
    envelopes,
  );

  return {
    document: {
      root: {
        ...baseDocument.root,
        type: "root",
        children: sanitizedChildren,
      },
    },
    envelopes,
  };
}

export function appendMetadataEnvelopes(
  content: string,
  envelopes: readonly MetadataEnvelope[],
): string {
  if (envelopes.length === 0) {
    return content;
  }

  const comments = envelopes.map((envelope) => {
    const payload = JSON.stringify(envelope);
    return `<!-- ${ENVELOPE_PREFIX} v${ENVELOPE_VERSION} ${payload} -->`;
  });
  const suffix = comments.join("\n");

  if (!content) {
    return suffix;
  }

  return `${content}${content.endsWith("\n") ? "" : "\n"}${suffix}`;
}

export function extractMetadataEnvelopes(content: string): ExtractedMetadataEnvelopes {
  const envelopes: MetadataEnvelope[] = [];
  const warnings: string[] = [];
  const regex = new RegExp(ENVELOPE_REGEX.source, "g");

  for (const match of content.matchAll(regex)) {
    const versionValue = Number.parseInt(match[1] ?? "", 10);
    if (versionValue !== ENVELOPE_VERSION) {
      warnings.push(`Ignoring metadata envelope version v${match[1] ?? "unknown"}.`);
      continue;
    }

    try {
      const parsed = JSON.parse(match[2] ?? "");
      if (!isRecord(parsed)) {
        warnings.push("Ignoring metadata envelope with non-object payload.");
        continue;
      }

      const type = typeof parsed.type === "string" ? parsed.type : "";
      const id = typeof parsed.id === "string" ? parsed.id : "";
      const fallback = typeof parsed.fallback === "string" ? parsed.fallback : "";
      const strategy =
        parsed.strategy === "merge" || parsed.strategy === "replace"
          ? parsed.strategy
          : undefined;
      const rawPath = Array.isArray(parsed.path) ? parsed.path : [];
      const path = rawPath
        .filter((segment): segment is number => Number.isInteger(segment) && segment >= 0)
        .map((segment) => Number(segment));
      const node = isRecord(parsed.node) ? parsed.node : null;

      if (!id || !type || !node) {
        warnings.push("Ignoring metadata envelope with missing required fields.");
        continue;
      }

      envelopes.push({ id, type, path, node, fallback, strategy });
    } catch {
      warnings.push("Ignoring malformed metadata envelope payload.");
    }
  }

  return {
    content: content.replace(regex, "").trimEnd(),
    envelopes,
    warnings,
  };
}

export function rehydrateDocumentFromEnvelopes(
  document: JsonDocument,
  envelopes: readonly MetadataEnvelope[],
): JsonDocument {
  if (envelopes.length === 0) {
    return document;
  }

  const nextRoot = deepClone(document.root);

  for (const envelope of envelopes) {
    if (envelope.strategy === "merge") {
      mergeNodeAtPath(nextRoot, envelope.path, envelope.node);
      continue;
    }

    const restored = replaceNodeAtPath(nextRoot, envelope.path, envelope.node);
    if (restored) {
      continue;
    }

    if (!Array.isArray(nextRoot.children)) {
      nextRoot.children = [];
    }
    const rootChildren = nextRoot.children as unknown[];
    rootChildren.push(deepClone(envelope.node));
  }

  return {
    ...document,
    root: nextRoot,
  };
}

function hasOwnEntries(record: JsonRecord): boolean {
  return Object.keys(record).length > 0;
}

export function collectSupportedNodeMetadataPatches(
  input: unknown,
  options: {
    mode: BridgeMode;
    supportedNodeTypes: ReadonlySet<string>;
    extractPatch: (params: {
      mode: BridgeMode;
      type: string;
      path: number[];
      node: JsonRecord;
    }) => JsonRecord | null;
  },
): MetadataEnvelope[] {
  const baseDocument = normalizeDocument(input);
  const rootChildren = Array.isArray(baseDocument.root.children) ? baseDocument.root.children : [];
  const envelopes: MetadataEnvelope[] = [];
  const rootType = typeof baseDocument.root.type === "string" ? baseDocument.root.type : "root";

  if (rootType && options.supportedNodeTypes.has(rootType)) {
    const rootPatch = options.extractPatch({
      mode: options.mode,
      type: rootType,
      path: [],
      node: baseDocument.root,
    });

    if (rootPatch && hasOwnEntries(rootPatch)) {
      envelopes.push({
        id: createEnvelopeId(rootType, [], envelopes.length + 1),
        type: rootType,
        path: [],
        node: rootPatch,
        fallback: "",
        strategy: "merge",
      });
    }
  }

  const visitChildren = (children: unknown[], parentPath: readonly number[]): void => {
    for (const [index, child] of children.entries()) {
      if (!isRecord(child)) {
        continue;
      }

      const path = [...parentPath, index];
      const type = typeof child.type === "string" ? child.type : "";
      if (!type || !options.supportedNodeTypes.has(type)) {
        continue;
      }

      const patch = options.extractPatch({
        mode: options.mode,
        type,
        path,
        node: child,
      });

      if (patch && hasOwnEntries(patch)) {
        envelopes.push({
          id: createEnvelopeId(type, path, envelopes.length + 1),
          type,
          path,
          node: patch,
          fallback: "",
          strategy: "merge",
        });
      }

      if (Array.isArray(child.children)) {
        visitChildren(child.children, path);
      }
    }
  };

  visitChildren(rootChildren, []);
  return envelopes;
}
