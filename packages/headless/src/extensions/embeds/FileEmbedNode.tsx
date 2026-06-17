/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { ElementTransformer } from "@lexical/markdown";
import type { ReactNode } from "react";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { useEmbedResolvers } from "./EmbedResolverContext";

/**
 * Serialized shape of a {@link FileEmbedNode}. Only the verbatim `target` (the
 * `file.ext` reference) is persisted; the resolved URL and the chosen media
 * element are derived at render time, so the stored data mirrors the markdown.
 */
export type SerializedFileEmbedNode = Spread<
  {
    target: string;
  },
  SerializedLexicalNode
>;

const IMAGE_EXTENSION = /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i;
const AUDIO_EXTENSION = /\.(?:mp3|wav|ogg|oga|m4a|flac|aac)$/i;
const VIDEO_EXTENSION = /\.(?:mp4|webm|mov|m4v|ogv)$/i;

type EmbedKind = "image" | "audio" | "video" | "file";

function classifyEmbed(target: string): EmbedKind {
  if (IMAGE_EXTENSION.test(target)) {
    return "image";
  }
  if (AUDIO_EXTENSION.test(target)) {
    return "audio";
  }
  if (VIDEO_EXTENSION.test(target)) {
    return "video";
  }
  return "file";
}

/**
 * React view for a file embed. Resolves the target to a URL through the host
 * {@link EmbedResolvers} and renders the matching media element; when no URL can
 * be resolved (no host wired, or a non-media file) it renders a reference chip
 * showing the raw target, so the embed is always visible and the markdown still
 * round-trips.
 */
function FileEmbedComponent({ target }: { target: string }): ReactNode {
  const { resolveMediaUrl } = useEmbedResolvers();
  const url =
    typeof resolveMediaUrl === "function" ? resolveMediaUrl(target) : "";
  const kind = classifyEmbed(target);

  if (url && kind === "image") {
    return (
      <img className="luthor-file-embed luthor-file-embed--image" src={url} alt={target} />
    );
  }

  if (url && kind === "audio") {
    return (
      <audio className="luthor-file-embed luthor-file-embed--audio" controls src={url} />
    );
  }

  if (url && kind === "video") {
    return (
      <video className="luthor-file-embed luthor-file-embed--video" controls src={url} />
    );
  }

  const chip = (
    <span className="luthor-file-embed luthor-file-embed--chip" data-luthor-file-embed-target={target}>
      {target}
    </span>
  );

  if (url) {
    return (
      <a
        className="luthor-file-embed luthor-file-embed--link"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-luthor-file-embed-target={target}
      >
        {target}
      </a>
    );
  }

  return chip;
}

/**
 * A block-level `![[file.ext]]` media embed. The node stores the file reference
 * verbatim and resolves media through the {@link EmbedResolvers} context, so it
 * is host-agnostic. The companion {@link FILE_EMBED_MARKDOWN_TRANSFORMER} gives
 * it a lossless round-trip.
 */
export class FileEmbedNode extends DecoratorNode<ReactNode> {
  /** The file reference as written inside `![[target]]`. */
  __target: string;

  static getType(): string {
    return "fileEmbed";
  }

  static clone(node: FileEmbedNode): FileEmbedNode {
    return new FileEmbedNode(node.__target, node.__key);
  }

  static importJSON(serialized: SerializedFileEmbedNode): FileEmbedNode {
    return $createFileEmbedNode(serialized.target);
  }

  // File embeds are authored through markdown, not pasted HTML; the explicit
  // null import keeps Lexical from warning about the custom exportDOM.
  static importDOM(): DOMConversionMap | null {
    return null;
  }

  constructor(target: string, key?: NodeKey) {
    super(key);
    this.__target = target;
  }

  exportJSON(): SerializedFileEmbedNode {
    return {
      type: "fileEmbed",
      version: 1,
      target: this.__target,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "luthor-file-embed-shell";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement("div");
    div.className = "luthor-file-embed luthor-file-embed--chip";
    div.setAttribute("data-luthor-file-embed-target", this.__target);
    div.textContent = this.__target;
    return { element: div };
  }

  isInline(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTextContent(): string {
    return this.__target;
  }

  getTarget(): string {
    return this.__target;
  }

  decorate(): ReactNode {
    return <FileEmbedComponent target={this.__target} />;
  }
}

/** Create a {@link FileEmbedNode}. */
export function $createFileEmbedNode(target: string): FileEmbedNode {
  return new FileEmbedNode(target);
}

/** Type guard for {@link FileEmbedNode}. */
export function $isFileEmbedNode(
  node: LexicalNode | null | undefined,
): node is FileEmbedNode {
  return node instanceof FileEmbedNode;
}

/**
 * Headless extension that registers {@link FileEmbedNode} with the editor. The
 * node is rendered by its decorator and parsed/serialized by
 * {@link FILE_EMBED_MARKDOWN_TRANSFORMER}; registration contributes only the node
 * class.
 */
export class FileEmbedExtension extends BaseExtension<"fileEmbed"> {
  constructor() {
    super("fileEmbed", [ExtensionCategory.Floating]);
  }

  register(): () => void {
    return () => {};
  }

  getNodes(): Array<typeof FileEmbedNode> {
    return [FileEmbedNode];
  }
}

export const fileEmbedExtension = new FileEmbedExtension();

/**
 * Lossless bidirectional markdown transformer for {@link FileEmbedNode}.
 *
 * Import: a line that is exactly `![[file.ext]]` becomes a file embed.
 * Export: a file embed serializes back to `![[file.ext]]`, so a body that
 * round-trips through the editor is byte-stable for these embeds.
 */
export const FILE_EMBED_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [FileEmbedNode],
  export: (node) => {
    if (!$isFileEmbedNode(node)) {
      return null;
    }

    return `![[${node.getTarget()}]]`;
  },
  regExp: /^!\[\[([^\]]+)\]\]\s*$/,
  replace: (parentNode: ElementNode, _children, match) => {
    const target = (match[1] ?? "").trim();
    if (!target) {
      return;
    }

    parentNode.replace($createFileEmbedNode(target));
  },
  type: "element",
};
