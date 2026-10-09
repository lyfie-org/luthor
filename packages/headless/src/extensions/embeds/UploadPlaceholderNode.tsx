/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { ElementTransformer } from "@lexical/markdown";
import { useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { LexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { classifyMedia } from "../media/mediaGrammar";
import { formatBytes } from "../media/MediaFrame";
import { useIsEditable } from "../media/mediaSelection";
import { uploadRegistry } from "./uploads";

/** Serialized {@link UploadPlaceholderNode}: what collaborators may know. */
export type SerializedUploadPlaceholderNode = Spread<
  {
    uploadId: string;
    name: string;
    size: number;
    /** `image`, `video`, `audio`, `pdf` or `file`. */
    kind: string;
    /** When the upload started (ms since epoch) — an abandoned one goes stale. */
    startedAt: number;
  },
  SerializedLexicalNode
>;

/** An upload that has been silent this long was abandoned (tab closed, crash). */
export const UPLOAD_STALE_AFTER_MS = 15 * 60 * 1000;

/**
 * Where a file being uploaded will appear. Inserted the moment it is dropped or
 * pasted, in order, at the drop point — so a batch lands in the order it was
 * given no matter which upload finishes first — and replaced in place by the
 * real `![[file]]` embed when its upload completes.
 *
 * It carries nothing private: no `blob:` URL, no file contents. The tab doing
 * the upload shows progress and a preview from its local registry; everyone
 * else (collaborators, the server) sees "Uploading …". It writes nothing to
 * markdown, so a save mid-upload never persists it.
 */
export class UploadPlaceholderNode extends DecoratorNode<ReactNode> {
  __uploadId: string;
  __name: string;
  __size: number;
  __kind: string;
  __startedAt: number;

  static getType(): string {
    return "uploadPlaceholder";
  }

  static clone(node: UploadPlaceholderNode): UploadPlaceholderNode {
    return new UploadPlaceholderNode(
      { uploadId: node.__uploadId, name: node.__name, size: node.__size, kind: node.__kind, startedAt: node.__startedAt },
      node.__key,
    );
  }

  static importJSON(serialized: SerializedUploadPlaceholderNode): UploadPlaceholderNode {
    return new UploadPlaceholderNode(serialized);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  // Collaboration constructs nodes without arguments, then copies properties.
  constructor(
    fields?: Pick<SerializedUploadPlaceholderNode, "uploadId" | "name" | "size" | "kind" | "startedAt">,
    key?: NodeKey,
  ) {
    super(key);
    this.__uploadId = fields?.uploadId ?? "";
    this.__name = fields?.name ?? "";
    this.__size = fields?.size ?? 0;
    this.__kind = fields?.kind ?? "file";
    this.__startedAt = fields?.startedAt ?? Date.now();
  }

  exportJSON(): SerializedUploadPlaceholderNode {
    return {
      type: "uploadPlaceholder",
      version: 1,
      uploadId: this.__uploadId,
      name: this.__name,
      size: this.__size,
      kind: this.__kind,
      startedAt: this.__startedAt,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "luthor-upload-shell";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    return { element: null };
  }

  isInline(): boolean {
    return false;
  }

  getTextContent(): string {
    return "";
  }

  getUploadId(): string {
    return this.getLatest().__uploadId;
  }

  decorate(): ReactNode {
    return (
      <UploadPlaceholderCard
        nodeKey={this.__key}
        uploadId={this.__uploadId}
        name={this.__name}
        size={this.__size}
        kind={this.__kind}
        startedAt={this.__startedAt}
      />
    );
  }
}

export function $createUploadPlaceholderNode(file: File, uploadId: string): UploadPlaceholderNode {
  return new UploadPlaceholderNode({
    uploadId,
    name: file.name || "file",
    size: file.size,
    kind: classifyMedia(file.name || ""),
    startedAt: Date.now(),
  });
}

export function $isUploadPlaceholderNode(node: LexicalNode | null | undefined): node is UploadPlaceholderNode {
  return node instanceof UploadPlaceholderNode;
}

/** Find the placeholder for an upload (null when it was deleted meanwhile). */
export function $findUploadPlaceholder(uploadId: string): UploadPlaceholderNode | null {
  const visit = (node: LexicalNode): UploadPlaceholderNode | null => {
    if ($isUploadPlaceholderNode(node)) return node.getUploadId() === uploadId ? node : null;
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        const hit = visit(child);
        if (hit) return hit;
      }
    }
    return null;
  };
  return visit($getRoot());
}

/**
 * Markdown for a placeholder: nothing. An in-flight upload is not content yet —
 * a save while it runs must not write anything for it.
 */
export const UPLOAD_PLACEHOLDER_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [UploadPlaceholderNode],
  export: (node) => ($isUploadPlaceholderNode(node) ? "" : null),
  // Never produced from markdown.
  regExp: /(?!)/,
  replace: () => false,
  type: "element",
};

function UploadPlaceholderCard(props: {
  nodeKey: string;
  uploadId: string;
  name: string;
  size: number;
  kind: string;
  startedAt: number;
}): ReactNode {
  const { nodeKey, uploadId, name, size, kind, startedAt } = props;
  const composer = useContext(LexicalComposerContext);
  const editor = composer ? composer[0] : null;
  const editable = useIsEditable(editor);
  // Re-render on registry changes; read this upload's task (local only).
  useSyncExternalStore(uploadRegistry.subscribe, uploadRegistry.version, uploadRegistry.version);
  const task = uploadRegistry.get(uploadId);
  const actionsRef = useRef<HTMLSpanElement | null>(null);

  const stale = !task && Date.now() - startedAt > UPLOAD_STALE_AFTER_MS;
  const failed = task?.status === "error";
  const percent = task?.progress != null ? Math.round(task.progress * 100) : null;
  // Every byte sent, the server still storing it (thumbnails, metadata): say
  // so, rather than sitting at a frozen 100%.
  const processing = !failed && !stale && percent !== null && percent >= 100;

  const remove = () => {
    task?.cancel();
    editor?.update(
      () => {
        const node = $getNodeByKey(nodeKey);
        if ($isUploadPlaceholderNode(node)) node.remove();
      },
      { tag: "history-merge" },
    );
  };

  // Buttons inside a decorator: handled natively so the editor's own root
  // listeners never treat the click as a selection change.
  useEffect(() => {
    const element = actionsRef.current;
    if (!element) return;
    const swallow = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const onClick = (event: MouseEvent) => {
      swallow(event);
      const action = (event.target as Element | null)?.closest?.("[data-upload-action]")?.getAttribute("data-upload-action");
      if (action === "retry") task?.retry();
      if (action === "remove") remove();
    };
    element.addEventListener("mousedown", swallow);
    element.addEventListener("pointerdown", swallow);
    element.addEventListener("click", onClick);
    return () => {
      element.removeEventListener("mousedown", swallow);
      element.removeEventListener("pointerdown", swallow);
      element.removeEventListener("click", onClick);
    };
  });

  const label = failed
    ? `Couldn't upload ${name}`
    : stale
      ? `${name} didn't finish uploading`
      : task
        ? `Uploading ${name}`
        : `${name} is being uploaded…`;

  return (
    <div
      className={`luthor-upload luthor-upload--${kind}${failed ? " is-error" : ""}${stale ? " is-stale" : ""}${task?.previewUrl ? " has-preview" : ""}${processing ? " is-processing" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      contentEditable={false}
    >
      {task?.previewUrl ? <img className="luthor-upload__preview" src={task.previewUrl} alt="" /> : null}
      <div className="luthor-upload__body">
        <span className="luthor-upload__name">{name}</span>
        <span className="luthor-upload__detail">
          {failed
            ? task?.error || "Upload failed"
            : stale
              ? "Upload didn't finish"
              : [
                  formatBytes(size),
                  processing ? "Finishing up…" : percent !== null ? `${percent}%` : task?.status === "queued" ? "Waiting…" : null,
                ].filter(Boolean).join(" · ")}
        </span>
        {!failed && !stale ? (
          <span
            className={`luthor-upload__bar${percent === null || processing ? " is-indeterminate" : ""}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={processing ? undefined : (percent ?? undefined)}
          >
            <span style={{ width: percent === null || processing ? undefined : `${percent}%` }} />
          </span>
        ) : null}
      </div>
      {editable && (task || stale) ? (
        <span ref={actionsRef} className="luthor-upload__actions">
          {failed ? (
            <button type="button" className="luthor-media__button" data-upload-action="retry">
              Retry
            </button>
          ) : null}
          <button
            type="button"
            className="luthor-media__button"
            data-upload-action="remove"
            aria-label={failed || stale ? `Remove ${name}` : `Cancel uploading ${name}`}
          >
            {failed || stale ? "Remove" : "Cancel"}
          </button>
        </span>
      ) : null}
    </div>
  );
}
