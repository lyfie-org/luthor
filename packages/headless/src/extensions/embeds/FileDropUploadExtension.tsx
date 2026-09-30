/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Drop / paste / pick → upload → `![[filename]]`.
 *
 * The pipeline, and the promises it keeps:
 *
 * - **Where and in what order.** A drop lands where it was dropped; a paste or
 *   a picked file at the caret. Every file gets a placeholder straight away, in
 *   the order given, and each is replaced in place when its upload finishes —
 *   so a batch always reads in the order it was dropped, whatever finishes
 *   first.
 * - **Honest progress.** At most three uploads run at once; each placeholder
 *   shows progress, can be cancelled, and on failure offers Retry or Remove.
 * - **Pastes do what the person meant.** Copying from Word, Excel or a web page
 *   puts formatted text *and* a picture of it on the clipboard; the text wins.
 *   Only a clipboard that is just files (a screenshot, a copied image) uploads.
 * - **Never into a read-only note**, and never a `blob:` URL into the shared
 *   document (the placeholder carries only a name and size).
 * - **The host stays in charge.** The upload callback is read when a file is
 *   uploaded, never captured at setup, so a host that swaps its callback is
 *   honoured; errors go to `onUploadError`, once; nothing stops the drop event
 *   from reaching the host's own handlers — a `luthor:media-drop` event says an
 *   upload started.
 *
 * Without an `uploadFile` callback the extension is inert.
 */

import {
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import {
  type BaseExtensionConfig,
  ExtensionCategory,
} from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { $createFileEmbedNode } from "./FileEmbedNode";
import { $createUploadPlaceholderNode, $findUploadPlaceholder, $isUploadPlaceholderNode } from "./UploadPlaceholderNode";
import { createUploadId, UploadQueue, uploadRegistry } from "./uploads";
import { reportError } from "../../utils/logger";

// Failures of the upload itself are reported through onUploadError as they
// happen; anything else escaping the pipeline is a bug — say so, never swallow.
const REPORTED = Symbol("luthor.uploadReported");

function logUnexpected(error: unknown): void {
  const reported = typeof error === "object" && error !== null && (error as Record<symbol, unknown>)[REPORTED];
  const aborted = error instanceof DOMException && error.name === "AbortError";
  if (!reported && !aborted) reportError("fileDropUpload: upload pipeline failed", error);
}

function markReported<T>(error: T): T {
  if (typeof error === "object" && error !== null) {
    try {
      (error as Record<symbol, unknown>)[REPORTED] = true;
    } catch {
      // Frozen error objects: logged twice at worst.
    }
  }
  return error;
}

/** What an upload callback is given besides the file. */
export interface UploadFileOptions {
  /** Aborted when the person cancels; pass it to `fetch` / XHR. */
  signal: AbortSignal;
  /** Report progress, 0–1. */
  onProgress: (fraction: number) => void;
}

export interface FileDropUploadConfig extends BaseExtensionConfig {
  /**
   * Host upload callback. The returned filename is written into the body
   * as `![[filename]]`, so it must be storage-safe AND wikilink-safe: the
   * characters `[ ] # ^ |` and line breaks cannot round-trip through the
   * `![[...]]` syntax. The extension strips them defensively before
   * inserting (see {@link sanitizeEmbedTarget}); a host that stores the
   * file under the unsanitized name will serve a broken reference, so
   * sanitize on the server too.
   */
  uploadFile?: (file: File, options: UploadFileOptions) => Promise<{ filename: string }>;
  /**
   * Refuse a file before uploading it (too big, a type the host won't take):
   * return a message to show, or `null` to accept.
   */
  validateFile?: (file: File) => string | null;
  /** Report a failed or refused upload (a toast). Called once per failure. */
  onUploadError?: (error: unknown, file: File) => void;
  /** Uploads that may run at once (default 3). */
  concurrency?: number;
}

/**
 * Makes a filename safe to embed inside `![[...]]`. The wikilink syntax has
 * no escape mechanism, so the reserved characters (`[ ] # ^ |`) and control
 * characters are replaced with `-` — otherwise a file named `x]]y.png`
 * injects markdown past the embed and corrupts the body on the next save.
 */
export function sanitizeEmbedTarget(filename: string): string {
  // eslint-disable-next-line no-control-regex
  return filename.replace(/[[\]#^|]|[\u0000-\u001f\u007f]/g, "-").trim();
}

/**
 * Whether a paste is really rich content (keep it as text) rather than files.
 * Word, Excel, Sheets and web pages put a rendered picture of the selection on
 * the clipboard next to the HTML; that picture must not replace the text.
 * A clipboard whose HTML is only an `<img>` (a copied image) or empty is files.
 */
export function isRichTextPaste(data: DataTransfer | null): boolean {
  if (!data) return false;
  const html = data.getData("text/html");
  if (html) {
    const images = (html.match(/<img\b/gi) ?? []).length;
    const text = html
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;|&#160;/gi, " ")
      .trim();
    if (text.length > 0 || images > 1) return true;
    return false;
  }
  // RTF with text alongside (a desktop app that offers no HTML).
  return !!data.getData("text/rtf") && data.getData("text/plain").trim().length > 0;
}

/** Commands contributed by {@link FileDropUploadExtension}. */
export type FileDropUploadCommands = {
  /**
   * Upload `file` and embed it after the caret's block — the same pipeline a
   * paste takes, for a host's own "attach file" control. Resolves once the
   * embed is in the document; rejects when the upload fails, is cancelled or
   * is refused (the placeholder then shows Retry/Remove, and `onUploadError`
   * has already been told).
   */
  uploadAndEmbedFile: (file: File) => Promise<void>;
  /** Several files at once, placed in order. */
  uploadAndEmbedFiles: (files: File[]) => Promise<void>;
};

/** The event a drop with files dispatches on the editor root (bubbles). */
export const MEDIA_DROP_EVENT = "luthor:media-drop";

export class FileDropUploadExtension extends BaseExtension<
  "fileDropUpload",
  FileDropUploadConfig,
  FileDropUploadCommands
> {
  private queue: UploadQueue;

  constructor(config: FileDropUploadConfig = {}) {
    super("fileDropUpload", [ExtensionCategory.Floating]);
    this.config = config;
    this.queue = new UploadQueue(config.concurrency ?? 3);
  }

  private get enabled(): boolean {
    return typeof this.config.uploadFile === "function";
  }

  register(editor: LexicalEditor): () => void {
    const removePaste = editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        if (!this.enabled || !editor.isEditable()) return false;
        const data = event.clipboardData;
        const files = data ? Array.from(data.files ?? []) : [];
        if (files.length === 0 || isRichTextPaste(data)) return false;
        event.preventDefault();
        void this.uploadFiles(editor, files, "selection").catch(logUnexpected);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );

    // Bound through the root listener so a remounted content-editable (a view
    // switch) keeps its drop target.
    let detach: (() => void) | null = null;
    const removeRoot = editor.registerRootListener((root, previous) => {
      detach?.();
      detach = null;
      void previous;
      if (!root) return;
      const onDragOver = (event: DragEvent) => {
        if (!this.enabled || !editor.isEditable()) return;
        if (event.dataTransfer?.types.includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      };
      const onDrop = (event: DragEvent) => {
        if (!this.enabled || !editor.isEditable()) return;
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (files.length === 0) return;
        // No stopPropagation: the host's own drop handling (an overlay that
        // must reset) still sees the event.
        event.preventDefault();
        root.dispatchEvent(new CustomEvent(MEDIA_DROP_EVENT, { bubbles: true, detail: { count: files.length } }));
        const at = { x: event.clientX, y: event.clientY };
        void this.uploadFiles(editor, files, at).catch(logUnexpected);
      };
      root.addEventListener("dragover", onDragOver);
      root.addEventListener("drop", onDrop);
      detach = () => {
        root.removeEventListener("dragover", onDragOver);
        root.removeEventListener("drop", onDrop);
      };
    });

    return () => {
      removePaste();
      removeRoot();
      detach?.();
    };
  }

  getCommands(editor: LexicalEditor): FileDropUploadCommands {
    return {
      uploadAndEmbedFile: async (file: File) => {
        if (!this.enabled) throw new Error("fileDropUpload: no uploadFile callback is configured");
        await this.uploadFiles(editor, [file], "selection");
      },
      uploadAndEmbedFiles: async (files: File[]) => {
        if (!this.enabled) throw new Error("fileDropUpload: no uploadFile callback is configured");
        await this.uploadFiles(editor, files, "selection");
      },
    };
  }

  /**
   * Validate, place a placeholder per file (in order), then upload each and
   * swap its placeholder for the embed. Resolves when all are embedded;
   * rejects with the first failure (every failure is still reported).
   */
  private async uploadFiles(
    editor: LexicalEditor,
    files: File[],
    where: "selection" | { x: number; y: number },
  ): Promise<void> {
    if (!editor.isEditable()) throw new Error("fileDropUpload: the editor is read-only");

    const accepted: File[] = [];
    let refusal: Error | null = null;
    for (const file of files) {
      const message = this.config.validateFile?.(file) ?? null;
      if (message) {
        const error = markReported(new Error(message));
        refusal ??= error;
        this.config.onUploadError?.(error, file);
      } else {
        accepted.push(file);
      }
    }
    if (accepted.length === 0) {
      throw refusal ?? new Error("fileDropUpload: nothing to upload");
    }

    const ids = accepted.map(() => createUploadId());
    const anchorBlock = where === "selection" ? null : blockAtPoint(editor, where.x, where.y);
    editor.update(() => {
      const placeholders = accepted.map((file, i) => $createUploadPlaceholderNode(file, ids[i]!));
      $insertBlocks(placeholders, anchorBlock);
    });

    const results = await Promise.allSettled(accepted.map((file, i) => this.runUpload(editor, file, ids[i]!)));
    const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failure) throw failure.reason;
    if (refusal) throw refusal;
  }

  /** Upload one file for an existing placeholder; retries reuse the placeholder. */
  private runUpload(editor: LexicalEditor, file: File, id: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let controller = new AbortController();
      let settled = false;
      const previewUrl =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function" && file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null;

      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        if (error === undefined) resolve();
        else reject(error);
      };

      const cancel = () => {
        controller.abort();
        uploadRegistry.delete(id);
        finish(new DOMException("Upload cancelled", "AbortError"));
      };

      const attempt = () => {
        controller = new AbortController();
        uploadRegistry.update(id, { status: "queued", error: null, progress: null });
        void this.queue
          .run(async () => {
            if (controller.signal.aborted) throw new DOMException("Upload cancelled", "AbortError");
            uploadRegistry.update(id, { status: "uploading" });
            const uploadFile = this.config.uploadFile;
            if (typeof uploadFile !== "function") throw new Error("fileDropUpload: no uploadFile callback is configured");
            return uploadFile(file, {
              signal: controller.signal,
              onProgress: (fraction) => {
                if (Number.isFinite(fraction)) uploadRegistry.update(id, { progress: Math.max(0, Math.min(1, fraction)) });
              },
            });
          })
          .then(
            ({ filename }) => {
              const target = sanitizeEmbedTarget(filename);
              let placed = false;
              editor.update(
                () => {
                  const placeholder = $findUploadPlaceholder(id);
                  if (!placeholder) return; // removed while uploading
                  if (!target) {
                    placeholder.remove();
                    return;
                  }
                  placeholder.replace($createFileEmbedNode(target));
                  placed = true;
                },
                // Part of the same undoable step as the drop, not a new one.
                { tag: "history-merge" },
              );
              uploadRegistry.delete(id);
              if (placed || !target) finish();
              else finish(new DOMException("Upload removed", "AbortError"));
            },
            (error: unknown) => {
              if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
                return; // cancel() already settled it
              }
              uploadRegistry.update(id, {
                status: "error",
                error: error instanceof Error && error.message ? error.message : "Upload failed",
              });
              this.config.onUploadError?.(error, file);
              finish(markReported(error));
            },
          );
      };

      uploadRegistry.set({
        id,
        file,
        status: "queued",
        progress: null,
        previewUrl,
        error: null,
        cancel,
        // A retry is a fresh attempt for the same placeholder; the caller who
        // awaited the first attempt has already been told it failed.
        retry: () => {
          settled = true;
          attempt();
        },
      });
      attempt();
    });
  }
}

/** The top-level block under a point in the editor, or null. */
function blockAtPoint(editor: LexicalEditor, x: number, y: number): { key: string; before: boolean } | null {
  const root = editor.getRootElement();
  if (!root || typeof document === "undefined" || typeof document.elementFromPoint !== "function") return null;
  let element = document.elementFromPoint(x, y);
  if (!element || !root.contains(element)) return null;
  // Walk up to a direct child of the root: a top-level block.
  while (element && element.parentElement !== root) element = element.parentElement;
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const before = y < rect.top + rect.height / 2;
  let key: string | null = null;
  editor.read(() => {
    const node = $getNearestNodeFromDOMNode(element!);
    key = node ? (node.getTopLevelElement()?.getKey() ?? node.getKey()) : null;
  });
  return key ? { key, before } : null;
}

/**
 * Insert blocks, in order: before/after the block under a drop point, else
 * after the caret's block, else at the end. An empty paragraph the caret sat
 * in is replaced by the uploads. A paragraph follows the last one when nothing
 * else does, so typing can continue after an upload at the end of a note.
 */
function $insertBlocks(blocks: LexicalNode[], at: { key: string; before: boolean } | null): void {
  if (blocks.length === 0) return;
  const root = $getRoot();
  let anchor: LexicalNode | null = null;
  let before = false;

  if (at) {
    anchor = root.getChildren().find((child) => child.getKey() === at.key) ?? null;
    before = at.before;
  }
  if (!anchor) {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      anchor = selection.anchor.getNode().getTopLevelElement();
    } else if ($isNodeSelection(selection)) {
      const node = selection.getNodes()[0];
      anchor = node ? (node.getTopLevelElement() ?? node) : null;
    }
  }

  const replaceEmpty =
    !!anchor && !before && $isElementNode(anchor) && anchor.getType() === "paragraph" && anchor.isEmpty();
  const [first, ...rest] = blocks;
  if (!anchor) root.append(first!);
  else if (before) anchor.insertBefore(first!);
  else anchor.insertAfter(first!);
  let last = first!;
  for (const block of rest) {
    last.insertAfter(block);
    last = block;
  }
  if (replaceEmpty) anchor!.remove();

  const next = last.getNextSibling();
  if (!next) {
    const paragraph = $createParagraphNode();
    last.insertAfter(paragraph);
    paragraph.select();
  } else if ($isElementNode(next)) {
    next.selectStart();
  }
}

export { $isUploadPlaceholderNode };

export const fileDropUploadExtension = new FileDropUploadExtension();
