/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { act, render } from "@testing-library/react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $createParagraphNode, $getRoot, type LexicalEditor } from "lexical";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  $isUploadPlaceholderNode,
  UPLOAD_STALE_AFTER_MS,
  UploadPlaceholderNode,
} from "./UploadPlaceholderNode";
import { uploadRegistry, type UploadTask } from "./uploads";

afterEach(() => {
  for (const id of ["up-a", "up-b"]) uploadRegistry.delete(id);
});

function Capture({ onEditor }: { onEditor: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    onEditor(editor);
  }, [editor, onEditor]);
  return null;
}

async function mount(startedAt = Date.now()) {
  let editor: LexicalEditor | null = null;
  const view = render(
    <LexicalComposer
      initialConfig={{
        namespace: "upload-placeholder",
        nodes: [UploadPlaceholderNode],
        onError: (error) => {
          throw error;
        },
        editorState: () => {
          $getRoot().append(
            $createParagraphNode(),
            new UploadPlaceholderNode({ uploadId: "up-a", name: "beach.png", size: 2048, kind: "image", startedAt }),
          );
        },
      }}
    >
      <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      <Capture onEditor={(e) => (editor = e)} />
    </LexicalComposer>,
  );
  await act(async () => {});
  return { ...view, editor: editor as unknown as LexicalEditor };
}

function task(patch: Partial<UploadTask> = {}): UploadTask {
  return {
    id: "up-a",
    file: new File(["x"], "beach.png"),
    status: "uploading",
    progress: 0.5,
    previewUrl: null,
    error: null,
    cancel: vi.fn(),
    retry: vi.fn(),
    ...patch,
  };
}

const click = (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });

describe("upload placeholder card", () => {
  it("shows progress for this tab's upload, and Cancel stops and removes it", async () => {
    const t = task();
    uploadRegistry.set(t);
    const { container, editor } = await mount();
    expect(container.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("50");
    expect(container.textContent).toContain("2 KB · 50%");
    await click(container.querySelector('[data-upload-action="remove"]')!);
    expect(t.cancel).toHaveBeenCalledTimes(1);
    editor.getEditorState().read(() => expect($getRoot().getChildren().some($isUploadPlaceholderNode)).toBe(false));
  });

  it("once every byte is sent, says it is finishing rather than sitting at 100%", async () => {
    uploadRegistry.set(task({ progress: 1 }));
    const { container } = await mount();
    expect(container.textContent).toContain("Finishing up…");
    expect(container.textContent).not.toContain("100%");
    const bar = container.querySelector('[role="progressbar"]')!;
    expect(bar.classList.contains("is-indeterminate")).toBe(true);
    expect(bar.getAttribute("aria-valuenow")).toBeNull();
  });

  it("a failed upload offers Retry", async () => {
    const t = task({ status: "error", error: "offline", progress: null });
    uploadRegistry.set(t);
    const { container } = await mount();
    expect(container.textContent).toContain("offline");
    await click(container.querySelector('[data-upload-action="retry"]')!);
    expect(t.retry).toHaveBeenCalledTimes(1);
  });

  it("a collaborator sees 'being uploaded' with no controls", async () => {
    const { container } = await mount();
    expect(container.querySelector(".luthor-upload")!.getAttribute("aria-label")).toBe("beach.png is being uploaded…");
    expect(container.querySelector("[data-upload-action]")).toBeNull();
  });

  it("an abandoned upload goes stale and can be removed", async () => {
    const { container, editor } = await mount(Date.now() - UPLOAD_STALE_AFTER_MS - 1000);
    expect(container.textContent).toContain("didn't finish");
    await click(container.querySelector('[data-upload-action="remove"]')!);
    editor.getEditorState().read(() => expect($getRoot().getChildren().some($isUploadPlaceholderNode)).toBe(false));
  });
});
