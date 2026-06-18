/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Drop/paste → upload → `![[filename]]` pipeline.
 *
 * Intercepts file drops and clipboard pastes on the editor surface and
 * delegates them to a host-provided upload callback. On success the extension
 * inserts a {@link FileEmbedNode} referencing the stored filename, so the
 * body reads `![[filename]]` in markdown.
 *
 * The paste handler is registered at HIGH priority so it runs before the
 * built-in ImageExtension paste handler — Papyra stores all media as named
 * files (`![[photo.png]]`), not inline base64 images.
 *
 * When no `uploadFile` callback is provided, the extension is inert and all
 * drop/paste events fall through to the next handler.
 */

import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  type LexicalEditor,
} from "lexical";
import {
  type BaseExtensionConfig,
  ExtensionCategory,
} from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { $createFileEmbedNode } from "./FileEmbedNode";

export interface FileDropUploadConfig extends BaseExtensionConfig {
  uploadFile?: (file: File) => Promise<{ filename: string }>;
}

/**
 * Headless extension that wires drop/paste → upload → file embed insertion.
 * Pass `uploadFile` in the config to activate the pipeline; without it, the
 * extension is a no-op.
 */
export class FileDropUploadExtension extends BaseExtension<
  "fileDropUpload",
  FileDropUploadConfig
> {
  constructor(config: FileDropUploadConfig = {}) {
    super("fileDropUpload", [ExtensionCategory.Floating]);
    this.config = config;
  }

  register(editor: LexicalEditor): () => void {
    const uploadFile = this.config.uploadFile;
    if (typeof uploadFile !== "function") {
      return () => {};
    }

    const removePaste = editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const items = event.clipboardData?.items;
        if (!items) {
          return false;
        }

        const files: File[] = [];
        for (const item of Array.from(items)) {
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              files.push(file);
            }
          }
        }

        if (files.length === 0) {
          return false;
        }

        event.preventDefault();
        for (const file of files) {
          this.handleFileUpload(editor, file, uploadFile);
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const rootElement = editor.getRootElement();
    let removeDrop: (() => void) | null = null;

    if (rootElement) {
      const handleDragOver = (event: DragEvent) => {
        if (event.dataTransfer?.types.includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      };

      const handleDrop = (event: DragEvent) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        for (const file of Array.from(files)) {
          this.handleFileUpload(editor, file, uploadFile);
        }
      };

      rootElement.addEventListener("dragover", handleDragOver);
      rootElement.addEventListener("drop", handleDrop);

      removeDrop = () => {
        rootElement.removeEventListener("dragover", handleDragOver);
        rootElement.removeEventListener("drop", handleDrop);
      };
    }

    return () => {
      removePaste();
      removeDrop?.();
    };
  }

  private handleFileUpload(
    editor: LexicalEditor,
    file: File,
    uploadFile: (file: File) => Promise<{ filename: string }>,
  ): void {
    uploadFile(file).then(
      ({ filename }) => {
        editor.update(() => {
          const embedNode = $createFileEmbedNode(filename);
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchor = selection.anchor.getNode();
            const topElement = anchor.getTopLevelElement();
            if (topElement) {
              topElement.insertAfter(embedNode);
              return;
            }
          }

          $getRoot().append(embedNode);
        });
      },
      () => {
        // Upload failed — swallow silently. The host adapter owns error
        // reporting through its own UI (toasts, banners, etc.).
      },
    );
  }
}

export const fileDropUploadExtension = new FileDropUploadExtension();
