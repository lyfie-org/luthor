/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/**
 * Node-safe server half of Papyra's live collaboration.
 *
 * A collaboration server (e.g. a Hocuspocus hook) holds the authoritative Yjs
 * document for a note. This entry lets it read and write that document as
 * Papyra markdown without a DOM or React render:
 *
 * - {@link getPapyraCollabNodes} — the exact node classes the browser
 *   `PapyraEditor` registers, derived from the same builders, so a type a
 *   client writes into the doc is always one the server can decode.
 * - {@link createPapyraHeadlessCollab} — a headless editor bound to a `Y.Doc`
 *   with markdown import/export byte-identical to the browser `getMarkdown()`.
 */

import type { Doc } from "yjs";
import {
  $ensureBlockAnchors,
  jsonToMarkdown,
  markdownToJSON,
  type LexicalEditor,
  type MarkdownBridgeOptions,
} from "@lyfie/luthor-headless";
import {
  createHeadlessCollabSession,
  type HeadlessCollabOptions,
} from "@lyfie/luthor-headless/collab";
import { formatMarkdownSource } from "../../core/source-format";
import { createExtensiveExtensions } from "../extensive/extensions";
import {
  buildPapyraEmbedExtensions,
  PAPYRA_EMBED_NODES,
  PAPYRA_EMBED_TRANSFORMERS,
  PAPYRA_IMAGE_ALIGNMENT,
} from "../papyra/embeds";
import { papyraFeaturePolicy } from "../papyra/features";

type CollabNodes = HeadlessCollabOptions["nodes"];

/** Markdown bridge options identical to the browser PapyraEditor's. */
export const PAPYRA_MARKDOWN_OPTIONS: MarkdownBridgeOptions = {
  metadataMode: "none",
  extraNodes: PAPYRA_EMBED_NODES,
  extraTransformers: PAPYRA_EMBED_TRANSFORMERS,
  imageAlignment: PAPYRA_IMAGE_ALIGNMENT,
};

let cachedNodes: CollabNodes | null = null;

/**
 * Every node class a default `PapyraEditor` registers. Computed from the same
 * extension builders the browser uses, so the server can never lag the client.
 */
export function getPapyraCollabNodes(): CollabNodes {
  if (cachedNodes) {
    return cachedNodes;
  }
  const extensions = [
    ...createExtensiveExtensions({
      featureFlags: papyraFeaturePolicy.resolve(undefined),
    }),
    ...buildPapyraEmbedExtensions(undefined, {}),
  ];
  const nodes = new Set<CollabNodes[number]>();
  for (const extension of extensions) {
    for (const node of extension.getNodes?.() ?? []) {
      nodes.add(node as CollabNodes[number]);
    }
  }
  cachedNodes = [...nodes];
  return cachedNodes;
}

/** Parse Papyra markdown into a serialized Lexical document. */
export function papyraMarkdownToJSON(markdown: string) {
  return markdownToJSON(markdown, PAPYRA_MARKDOWN_OPTIONS);
}

/** Serialize a Lexical document exactly as the browser `getMarkdown()` does. */
export function papyraJSONToMarkdown(document: unknown): string {
  const root = (document as { root?: { children?: unknown[] } } | null)?.root;
  if (!root?.children || root.children.length === 0) {
    return "";
  }
  return formatMarkdownSource(jsonToMarkdown(document, PAPYRA_MARKDOWN_OPTIONS));
}

/** The headless editor + binding a collaboration server drives for one note. */
export interface PapyraHeadlessCollab {
  readonly editor: LexicalEditor;
  readonly doc: Doc;
  /** Whether the shared document has no content yet (fresh room). */
  isEmpty(): boolean;
  /** Current body as Papyra markdown (commits pending remote changes first). */
  getMarkdown(): string;
  /**
   * Replace the whole body with `markdown` as a single server-origin change —
   * for seeding an empty room or adopting an external file edit. Peers receive
   * it as an ordinary remote update.
   */
  setMarkdown(markdown: string): void;
  /**
   * Stamp missing / collapse duplicate block anchors. The server is the only
   * stamper in a collaborative room, so ids stay unique and stable. Returns
   * whether anything changed (and was synced to the doc).
   */
  ensureBlockAnchors(): boolean;
  dispose(): void;
}

/** Bind a headless Papyra editor to `doc` (which may already hold a room). */
export function createPapyraHeadlessCollab(
  doc: Doc,
  options: { onError?: (error: Error) => void } = {},
): PapyraHeadlessCollab {
  const session = createHeadlessCollabSession(doc, {
    id: "papyra",
    nodes: getPapyraCollabNodes(),
    onError: options.onError,
  });

  return {
    editor: session.editor,
    doc,
    isEmpty: session.isEmpty,
    getMarkdown: () => papyraJSONToMarkdown(session.toJSON()),
    setMarkdown: (markdown) => {
      session.replaceWithJSON(papyraMarkdownToJSON(markdown));
    },
    ensureBlockAnchors: () => {
      let changed = false;
      session.editor.update(
        () => {
          changed = $ensureBlockAnchors();
        },
        { discrete: true },
      );
      return changed;
    },
    dispose: session.dispose,
  };
}
