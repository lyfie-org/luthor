/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { act, fireEvent, render } from "@testing-library/react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
} from "lexical";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmbedResolverProvider, type EmbedResolvers } from "../embeds/EmbedResolverContext";
import {
  $createFileEmbedNode,
  $isFileEmbedNode,
  FileEmbedNode,
  fileEmbedExtension,
  type FileEmbedFields,
} from "../embeds/FileEmbedNode";
import { EditorPromptProvider, type RequestPrompt } from "./EditorPromptContext";

if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent = PointerEventPolyfill;
}

beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 1;
  });
  // The media frame is 300px wide inside an 800px-wide note.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const width = this.classList.contains("luthor-media__frame") || this.classList.contains("luthor-media--inline") ? 300 : 800;
    return { width, height: 200, top: 0, left: 0, right: width, bottom: 200, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => vi.restoreAllMocks());

function Capture({ onEditor }: { onEditor: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    onEditor(editor);
    return fileEmbedExtension.register(editor);
  }, [editor, onEditor]);
  return null;
}

async function mountEditor(
  fields: FileEmbedFields = { target: "photo.png" },
  resolvers: EmbedResolvers = {},
  requestPrompt?: RequestPrompt,
) {
  let editor: LexicalEditor | null = null;
  const tree = (
    <LexicalComposer
      initialConfig={{
        namespace: "media-interaction",
        nodes: [FileEmbedNode],
        onError: (error) => {
          throw error;
        },
        editorState: () => {
          const root = $getRoot();
          root.append($createParagraphNode(), $createFileEmbedNode(fields), $createParagraphNode());
        },
      }}
    >
      <EmbedResolverProvider resolvers={{ resolveMediaUrl: (t) => `/m/${t}`, ...resolvers }}>
        <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      </EmbedResolverProvider>
      <Capture onEditor={(e) => (editor = e)} />
    </LexicalComposer>
  );
  const view = render(requestPrompt ? <EditorPromptProvider requestPrompt={requestPrompt}>{tree}</EditorPromptProvider> : tree);
  await act(async () => {});
  return { ...view, editor: editor as unknown as LexicalEditor };
}

function embed(editor: LexicalEditor): FileEmbedNode {
  return editor.getEditorState().read(() => $getRoot().getChildren().find($isFileEmbedNode)!) as FileEmbedNode;
}

function markdown(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => embed(editor).getMarkdown());
}

async function select(container: HTMLElement) {
  await act(async () => {
    fireEvent.click(container.querySelector(".luthor-media__frame")!);
  });
}

async function tool(container: HTMLElement, id: string) {
  const button = container.querySelector(`[data-media-action="${id}"]`);
  expect(button, id).not.toBeNull();
  await act(async () => {
    button!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

describe("media frame in the editor", () => {
  it("a click selects it and shows its toolbar and handles", async () => {
    const { container, editor } = await mountEditor();
    expect(container.querySelector(".luthor-media__toolbar")).toBeNull();
    await select(container);
    expect(container.querySelector(".luthor-media.is-selected")).not.toBeNull();
    expect(container.querySelector(".luthor-media__toolbar")).not.toBeNull();
    expect(container.querySelectorAll(".luthor-media__handle")).toHaveLength(2);
    editor.getEditorState().read(() => expect($isNodeSelection($getSelection())).toBe(true));
  });

  it("clicking a selected picture again never remounts its toolbar (no blink)", async () => {
    const { container } = await mountEditor();
    await select(container);
    const toolbar = container.querySelector(".luthor-media__toolbar")!;
    const removed: Node[] = [];
    const observer = new MutationObserver((records) => records.forEach((r) => removed.push(...r.removedNodes)));
    observer.observe(container, { childList: true, subtree: true });
    for (let i = 0; i < 20; i++) await select(container);
    await act(async () => {});
    observer.disconnect();
    expect(container.querySelector(".luthor-media__toolbar")).toBe(toolbar);
    expect(removed.filter((n) => n === toolbar || (n as Element).contains?.(toolbar))).toHaveLength(0);
  });

  it("toolbar alignment toggles, and lands in the markdown", async () => {
    const { container, editor } = await mountEditor();
    await select(container);
    await tool(container, "align-center");
    expect(markdown(editor)).toBe("![[photo.png]] <!-- align:center -->");
    await tool(container, "align-center");
    expect(markdown(editor)).toBe("![[photo.png]]");
  });

  it("size presets use the container; Original size clears it", async () => {
    const { container, editor } = await mountEditor();
    await select(container);
    await tool(container, "size-0.5");
    expect(markdown(editor)).toBe("![[photo.png|400]]");
    await tool(container, "size-reset");
    expect(markdown(editor)).toBe("![[photo.png]]");
  });

  it("caption and alt text go through the editor's prompt", async () => {
    const prompt = vi.fn<RequestPrompt>(async (request): Promise<Record<string, string>> =>
      request.fields[0]!.name === "caption" ? { caption: "Dusk" } : { alt: "A beach" },
    );
    const { container, editor } = await mountEditor({ target: "photo.png" }, {}, prompt);
    await select(container);
    await tool(container, "caption");
    await tool(container, "alt");
    expect(markdown(editor)).toBe("![[photo.png|A beach]] <!-- caption:Dusk -->");
    expect(prompt.mock.calls[0]![0].fields[0]!.value).toBe("");
  });

  it("Remove deletes it and keeps the caret in the document", async () => {
    const { container, editor } = await mountEditor();
    await select(container);
    await tool(container, "remove");
    editor.getEditorState().read(() => {
      expect($getRoot().getChildren().some($isFileEmbedNode)).toBe(false);
      expect($getSelection()).not.toBeNull();
    });
  });

  it("host items appear, get the embed's context, and can replace the built-ins", async () => {
    const onSelect = vi.fn();
    const { container } = await mountEditor(
      { target: "photo.png", width: 200 },
      { mediaToolbar: { builtIn: false, items: (ctx) => [{ id: "replace", label: `Replace ${ctx.target} @${ctx.width}`, onSelect }] } },
    );
    await select(container);
    expect(container.querySelector('[data-media-action="align-left"]')).toBeNull();
    expect(container.querySelector('[data-media-action="replace"]')!.getAttribute("aria-label")).toBe("Replace photo.png @200");
    await tool(container, "replace");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("dragging a handle commits exactly one change", async () => {
    const { container, editor } = await mountEditor();
    const updates = vi.fn();
    editor.registerMutationListener(FileEmbedNode, (mutations) => updates(mutations), { skipInitialization: true });
    await select(container);
    const handle = container.querySelector(".luthor-media__handle--right")!;
    await act(async () => {
      fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 300 });
      for (let x = 305; x <= 400; x += 5) fireEvent.pointerMove(handle, { pointerId: 1, clientX: x });
      fireEvent.pointerUp(handle, { pointerId: 1, clientX: 400 });
    });
    expect(markdown(editor)).toBe("![[photo.png|400]]");
    expect(updates).toHaveBeenCalledTimes(1);
  });

  it("keyboard: Shift+→ grows 10px, Alt+Shift+← shrinks 1px, Enter opens a line, Escape lets go", async () => {
    const { container, editor } = await mountEditor();
    await select(container);
    const key = (init: KeyboardEventInit) =>
      act(async () => {
        editor.dispatchCommand(KEY_DOWN_COMMAND, new KeyboardEvent("keydown", init));
      });
    await key({ key: "ArrowRight", shiftKey: true });
    expect(markdown(editor)).toBe("![[photo.png|310]]");
    await key({ key: "ArrowLeft", shiftKey: true, altKey: true });
    expect(markdown(editor)).toBe("![[photo.png|309]]");
    await key({ key: "Escape" });
    editor.getEditorState().read(() => expect($getSelection()).toBeNull());

    await select(container);
    await key({ key: "Enter" });
    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      const index = children.findIndex($isFileEmbedNode);
      expect(children[index + 1]!.getType()).toBe("paragraph");
      expect($isNodeSelection($getSelection())).toBe(false);
    });
  });

  it("read-only: no selection, toolbar or handles", async () => {
    const { container, editor } = await mountEditor();
    await act(async () => editor.setEditable(false));
    await select(container);
    expect(container.querySelector(".luthor-media.is-selected")).toBeNull();
    expect(container.querySelector(".luthor-media__toolbar")).toBeNull();
    expect(container.querySelector(".luthor-media__handle")).toBeNull();
  });
});
