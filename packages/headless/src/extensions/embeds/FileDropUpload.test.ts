/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  PASTE_COMMAND,
  createEditor,
  type LexicalEditor,
} from "lexical";
import {
  FileDropUploadExtension,
  isRichTextPaste,
  MEDIA_DROP_EVENT,
  type FileDropUploadConfig,
  type UploadFileOptions,
} from "./FileDropUploadExtension";
import { $isFileEmbedNode, FileEmbedNode } from "./FileEmbedNode";
import {
  $isUploadPlaceholderNode,
  UPLOAD_PLACEHOLDER_MARKDOWN_TRANSFORMER,
  UploadPlaceholderNode,
} from "./UploadPlaceholderNode";
import { uploadRegistry } from "./uploads";
import { jsonToMarkdown } from "../../core/markdown";

const disposers: Array<() => void> = [];
afterEach(() => {
  while (disposers.length > 0) disposers.pop()?.();
});

type Upload = NonNullable<FileDropUploadConfig["uploadFile"]>;

function createHarness(config: FileDropUploadConfig = {}) {
  const editor = createEditor({
    namespace: "file-drop-upload-test",
    nodes: [FileEmbedNode, UploadPlaceholderNode],
    onError: (error) => {
      throw error;
    },
  });
  const root = document.createElement("div");
  root.contentEditable = "true";
  document.body.appendChild(root);
  editor.setRootElement(root);

  const extension = new FileDropUploadExtension(config);
  const unregister = extension.register(editor);
  disposers.push(() => {
    unregister();
    root.remove();
  });

  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      const text = $createTextNode("hello");
      paragraph.append(text, );
      $getRoot().clear().append(paragraph, $createParagraphNode().append($createTextNode("after")));
      text.select(5, 5);
    },
    { discrete: true },
  );

  return { editor, extension, root, commands: extension.getCommands(editor) };
}

async function settle(editor: LexicalEditor) {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  editor.update(() => {}, { discrete: true });
}

/** Top-level blocks as short labels: text, `embed:x`, `uploading:x`. */
function blocks(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .map((node) =>
        $isFileEmbedNode(node)
          ? `embed:${node.getTarget()}`
          : $isUploadPlaceholderNode(node)
            ? `uploading:${node.__name}`
            : node.getTextContent(),
      ),
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const file = (name: string, type = "image/png") => new File(["x"], name, { type });

function clipboard(files: File[], data: Record<string, string> = {}) {
  return {
    files,
    types: [...(files.length ? ["Files"] : []), ...Object.keys(data)],
    getData: (type: string) => data[type] ?? "",
  } as unknown as DataTransfer;
}

function paste(editor: LexicalEditor, data: DataTransfer): { handled: boolean; prevented: boolean } {
  let prevented = false;
  const event = { clipboardData: data, preventDefault: () => (prevented = true) } as unknown as ClipboardEvent;
  let handled = false;
  editor.update(() => {
    handled = editor.dispatchCommand(PASTE_COMMAND, event);
  }, { discrete: true });
  return { handled, prevented };
}

describe("upload pipeline", () => {
  it("uploads through the host callback (with signal + progress) and embeds after the caret's block", async () => {
    const uploadFile = vi.fn<Upload>(async () => ({ filename: "photo.png" }));
    const { editor, commands } = createHarness({ uploadFile });
    const picked = file("photo.png");

    await commands.uploadAndEmbedFile(picked);
    await settle(editor);

    expect(uploadFile).toHaveBeenCalledWith(picked, expect.objectContaining({ signal: expect.any(AbortSignal), onProgress: expect.any(Function) }));
    expect(blocks(editor)).toEqual(["hello", "embed:photo.png", "after"]);
  });

  it("sanitizes the filename before it reaches the body", async () => {
    const { editor, commands } = createHarness({ uploadFile: async () => ({ filename: "a[b]#c.png" }) });
    await commands.uploadAndEmbedFile(file("x.png"));
    await settle(editor);
    expect(blocks(editor)).toContain("embed:a-b--c.png");
  });

  it("places a batch in the order given, whatever order the uploads finish in", async () => {
    const pending = new Map<string, ReturnType<typeof deferred<{ filename: string }>>>();
    const uploadFile: Upload = (f) => {
      const d = deferred<{ filename: string }>();
      pending.set(f.name, d);
      return d.promise;
    };
    const { editor, commands } = createHarness({ uploadFile });
    const done = commands.uploadAndEmbedFiles([file("1.png"), file("2.png"), file("3.png")]);
    await settle(editor);
    expect(blocks(editor)).toEqual(["hello", "uploading:1.png", "uploading:2.png", "uploading:3.png", "after"]);

    for (const name of ["3.png", "1.png", "2.png"]) {
      pending.get(name)!.resolve({ filename: `stored-${name}` });
      await settle(editor);
    }
    await done;
    expect(blocks(editor)).toEqual(["hello", "embed:stored-1.png", "embed:stored-2.png", "embed:stored-3.png", "after"]);
  });

  it("runs at most three uploads at once", async () => {
    let inFlight = 0;
    let peak = 0;
    const releases: Array<() => void> = [];
    const uploadFile: Upload = (f) =>
      new Promise((resolve) => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        releases.push(() => {
          inFlight--;
          resolve({ filename: f.name });
        });
      });
    const { editor, commands } = createHarness({ uploadFile });
    const done = commands.uploadAndEmbedFiles(["a", "b", "c", "d", "e", "f"].map((n) => file(`${n}.png`)));
    await settle(editor);
    expect(inFlight).toBe(3);
    while (releases.length) {
      releases.shift()!();
      await settle(editor);
    }
    await done;
    expect(peak).toBe(3);
    expect(blocks(editor).filter((b) => b.startsWith("embed:"))).toHaveLength(6);
  });

  it("reports progress into the local registry, and never puts a blob: URL in the document", async () => {
    let options: UploadFileOptions | null = null;
    const d = deferred<{ filename: string }>();
    const { editor, commands } = createHarness({
      uploadFile: (_f, o) => {
        options = o;
        return d.promise;
      },
    });
    const done = commands.uploadAndEmbedFile(file("big.png"));
    await settle(editor);
    options!.onProgress(0.42);
    const id = editor.getEditorState().read(() => $getRoot().getChildren().find($isUploadPlaceholderNode)!.getUploadId());
    expect(uploadRegistry.get(id)!.progress).toBeCloseTo(0.42);
    expect(JSON.stringify(editor.getEditorState().toJSON())).not.toContain("blob:");
    d.resolve({ filename: "big.png" });
    await done;
    expect(uploadRegistry.get(id)).toBeUndefined();
  });

  it("a failure keeps the placeholder with Retry, reports once, and Retry completes it", async () => {
    const onUploadError = vi.fn();
    let attempt = 0;
    const { editor, commands } = createHarness({
      onUploadError,
      uploadFile: async () => {
        attempt++;
        if (attempt === 1) throw new Error("offline");
        return { filename: "photo.png" };
      },
    });
    await expect(commands.uploadAndEmbedFile(file("photo.png"))).rejects.toThrow("offline");
    await settle(editor);
    expect(onUploadError).toHaveBeenCalledTimes(1);
    expect(blocks(editor)).toEqual(["hello", "uploading:photo.png", "after"]);
    const id = editor.getEditorState().read(() => $getRoot().getChildren().find($isUploadPlaceholderNode)!.getUploadId());
    expect(uploadRegistry.get(id)!.status).toBe("error");
    expect(uploadRegistry.get(id)!.error).toBe("offline");

    uploadRegistry.get(id)!.retry();
    await settle(editor);
    await settle(editor);
    expect(blocks(editor)).toEqual(["hello", "embed:photo.png", "after"]);
  });

  it("cancel aborts the request", async () => {
    let signal: AbortSignal | null = null;
    const { editor, commands } = createHarness({
      uploadFile: (_f, o) =>
        new Promise((_resolve, reject) => {
          signal = o.signal;
          o.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    });
    const done = commands.uploadAndEmbedFile(file("x.png"));
    await settle(editor);
    const id = editor.getEditorState().read(() => $getRoot().getChildren().find($isUploadPlaceholderNode)!.getUploadId());
    uploadRegistry.get(id)!.cancel();
    await expect(done).rejects.toMatchObject({ name: "AbortError" });
    expect(signal!.aborted).toBe(true);
  });

  it("refuses files the host rejects before uploading them", async () => {
    const uploadFile = vi.fn<Upload>();
    const onUploadError = vi.fn();
    const { editor, commands } = createHarness({
      uploadFile,
      onUploadError,
      validateFile: (f) => (f.size > 0 && f.name.endsWith(".exe") ? "That kind of file can't be attached." : null),
    });
    await expect(commands.uploadAndEmbedFile(file("setup.exe", "application/octet-stream"))).rejects.toThrow(/can't be attached/);
    expect(uploadFile).not.toHaveBeenCalled();
    expect(onUploadError).toHaveBeenCalledTimes(1);
    await settle(editor);
    expect(blocks(editor)).toEqual(["hello", "after"]);
  });

  it("never uploads into a read-only editor", async () => {
    const uploadFile = vi.fn<Upload>(async () => ({ filename: "x.png" }));
    const { editor, commands } = createHarness({ uploadFile });
    editor.setEditable(false);
    await expect(commands.uploadAndEmbedFile(file("x.png"))).rejects.toThrow(/read-only/);
    expect(paste(editor, clipboard([file("x.png")])).handled).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("uses the host's current callback, not the one it was set up with", async () => {
    const first = vi.fn<Upload>(async () => ({ filename: "old.png" }));
    const second = vi.fn<Upload>(async () => ({ filename: "new.png" }));
    const { editor, extension, commands } = createHarness({ uploadFile: first });
    (extension as unknown as { config: FileDropUploadConfig }).config.uploadFile = second;
    await commands.uploadAndEmbedFile(file("x.png"));
    await settle(editor);
    expect(first).not.toHaveBeenCalled();
    expect(blocks(editor)).toContain("embed:new.png");
  });

  it("adds a paragraph after an upload at the very end, so typing can continue", async () => {
    const { editor, commands } = createHarness({ uploadFile: async () => ({ filename: "x.png" }) });
    editor.update(() => $getRoot().getLastChild()!.selectEnd(), { discrete: true });
    await commands.uploadAndEmbedFile(file("x.png"));
    await settle(editor);
    expect(blocks(editor)).toEqual(["hello", "after", "embed:x.png", ""]);
  });

  it("no callback: the command refuses and pastes fall through", async () => {
    const { editor, commands } = createHarness();
    await expect(commands.uploadAndEmbedFile(file("x.png"))).rejects.toThrow(/no uploadFile/);
    expect(paste(editor, clipboard([file("x.png")])).handled).toBe(false);
  });
});

describe("paste policy", () => {
  it.each([
    ["a screenshot (files only)", [file("s.png")], {}, true],
    ["a copied image (html is just <img>)", [file("i.png")], { "text/html": '<meta charset="utf-8"><img src="https://x/y.png">' }, true],
    ["Word (formatted text + a picture of it)", [file("w.png")], { "text/html": "<html><body><p class=MsoNormal>Quarterly <b>report</b></p></body></html>", "text/plain": "Quarterly report" }, false],
    ["Excel (a table + a picture of it)", [file("e.png")], { "text/html": "<table><tr><td>1</td><td>2</td></tr></table>" }, false],
    ["Google Docs (text with an image inside)", [file("g.png")], { "text/html": '<b id="docs-internal"><p>Hello</p><img src="x"></b>' }, false],
    ["a web page with several images", [file("p.png")], { "text/html": '<img src="a"><img src="b">' }, false],
    ["RTF text from a desktop app", [file("r.png")], { "text/rtf": "{\\rtf1 hi}", "text/plain": "hi" }, false],
    ["plain text only", [], { "text/plain": "hello" }, false],
  ])("%s → upload: %s", async (_name, files, data, uploads) => {
    const uploadFile = vi.fn<Upload>(async (f) => ({ filename: f.name }));
    const { editor } = createHarness({ uploadFile });
    const result = paste(editor, clipboard(files as File[], data as Record<string, string>));
    await settle(editor);
    expect(result.handled).toBe(uploads);
    expect(result.prevented).toBe(uploads);
    expect(uploadFile).toHaveBeenCalledTimes(uploads ? 1 : 0);
  });

  it("isRichTextPaste ignores comments, styles and non-breaking spaces", () => {
    expect(isRichTextPaste(clipboard([], { "text/html": "<!--StartFragment--><style>p{}</style>&nbsp;<img src=a><!--EndFragment-->" }))).toBe(false);
  });
});

describe("drop", () => {
  function drop(target: HTMLElement, files: File[]) {
    const event = new Event("drop", { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(event, "dataTransfer", { value: clipboard(files) });
    Object.defineProperty(event, "clientX", { value: 10 });
    Object.defineProperty(event, "clientY", { value: 10 });
    target.dispatchEvent(event);
    return event;
  }

  it("uploads dropped files, lets the event reach the host, and announces it", async () => {
    const uploadFile = vi.fn<Upload>(async (f) => ({ filename: f.name }));
    const { editor, root } = createHarness({ uploadFile });
    const hostSawDrop = vi.fn();
    const announced = vi.fn();
    document.body.addEventListener("drop", hostSawDrop);
    document.body.addEventListener(MEDIA_DROP_EVENT, announced);
    const event = drop(root, [file("a.png"), file("b.png")]);
    await settle(editor);
    await settle(editor);
    document.body.removeEventListener("drop", hostSawDrop);
    document.body.removeEventListener(MEDIA_DROP_EVENT, announced);

    expect(event.defaultPrevented).toBe(true);
    expect(hostSawDrop).toHaveBeenCalledTimes(1);
    expect(announced).toHaveBeenCalledTimes(1);
    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(blocks(editor).filter((b) => b.startsWith("embed:"))).toEqual(["embed:a.png", "embed:b.png"]);
  });

  it("lands where it was dropped: above or below the block under the pointer", async () => {
    const uploadFile = vi.fn<Upload>(async (f) => ({ filename: f.name }));
    const { editor, root } = createHarness({ uploadFile });
    const blocksEl = Array.from(root.children) as HTMLElement[];
    const after = blocksEl[1]!; // the "after" paragraph
    after.getBoundingClientRect = () => ({ top: 100, height: 40, bottom: 140, left: 0, right: 500, width: 500, x: 0, y: 100, toJSON: () => ({}) }) as DOMRect;
    const original = document.elementFromPoint;
    document.elementFromPoint = () => after.firstChild as Element ?? after;
    try {
      // Lower half of "after": below it.
      const low = new Event("drop", { bubbles: true, cancelable: true }) as DragEvent;
      Object.defineProperty(low, "dataTransfer", { value: clipboard([file("below.png")]) });
      Object.defineProperty(low, "clientX", { value: 10 });
      Object.defineProperty(low, "clientY", { value: 130 });
      root.dispatchEvent(low);
      await settle(editor);
      await settle(editor);
      // Upper half: above it.
      const high = new Event("drop", { bubbles: true, cancelable: true }) as DragEvent;
      Object.defineProperty(high, "dataTransfer", { value: clipboard([file("above.png")]) });
      Object.defineProperty(high, "clientX", { value: 10 });
      Object.defineProperty(high, "clientY", { value: 105 });
      root.dispatchEvent(high);
      await settle(editor);
      await settle(editor);
    } finally {
      document.elementFromPoint = original;
    }
    expect(blocks(editor)).toEqual(["hello", "embed:above.png", "after", "embed:below.png", ""]);
  });

  it("follows the editor to a new root element", async () => {
    const uploadFile = vi.fn<Upload>(async (f) => ({ filename: f.name }));
    const { editor, root } = createHarness({ uploadFile });
    const next = document.createElement("div");
    next.contentEditable = "true";
    document.body.appendChild(next);
    editor.setRootElement(next);
    drop(root, [file("old-root.png")]);
    drop(next, [file("new-root.png")]);
    await settle(editor);
    await settle(editor);
    expect(uploadFile.mock.calls.map(([f]) => f.name)).toEqual(["new-root.png"]);
    next.remove();
  });

  it("ignores drops into a read-only editor", async () => {
    const uploadFile = vi.fn<Upload>();
    const { editor, root } = createHarness({ uploadFile });
    editor.setEditable(false);
    const event = drop(root, [file("a.png")]);
    await settle(editor);
    expect(event.defaultPrevented).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
  });
});

describe("placeholder in markdown", () => {
  it("writes nothing, so a save mid-upload persists nothing for it", () => {
    const doc = {
      root: {
        type: "root",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          { type: "paragraph", version: 1, format: "", indent: 0, direction: null, textFormat: 0, textStyle: "", children: [{ type: "text", version: 1, text: "Intro", format: 0, detail: 0, mode: "normal", style: "" }] },
          { type: "uploadPlaceholder", version: 1, uploadId: "up-1", name: "a.png", size: 1, kind: "image", startedAt: 1 },
        ],
      },
    };
    const md = jsonToMarkdown(doc, {
      metadataMode: "none",
      extraNodes: [UploadPlaceholderNode],
      extraTransformers: [UPLOAD_PLACEHOLDER_MARKDOWN_TRANSFORMER],
    });
    expect(md.trim()).toBe("Intro");
    expect(md).not.toContain("a.png");
    expect(md).not.toContain("Unsupported");
  });
});
