/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The real Papyra preset (no mocks), mounted in jsdom. Pins what a host reads
 * straight after adopting a document: `setMarkdown(x)` then `getMarkdown()`
 * must give back the preset's own syntax — block anchors, wikilinks — and not
 * the bridge's "[Unsupported … preserved in markdown metadata]" placeholders.
 *
 * It used to: the post-inject snapshot was serialized without the preset's
 * bridge extras, so until the next edit re-serialized, getMarkdown() returned
 * placeholder text. Papyra baselined its autosave on that, so the first change
 * notification after opening a note looked like an edit — an untouched note
 * was re-saved (and re-dated) on open, and a save could even carry the
 * placeholder text to disk.
 */

import { render, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { $getRoot } from "lexical";

vi.hoisted(() => {
  const win = globalThis as {
    InputEvent?: { prototype: { getTargetRanges?: () => StaticRange[] } };
  };
  if (win.InputEvent && !win.InputEvent.prototype.getTargetRanges) {
    win.InputEvent.prototype.getTargetRanges = () => [];
  }
});

import { PapyraEditor, type PapyraEditorRef } from "./PapyraEditor";

async function mount() {
  let handle: PapyraEditorRef | null = null;
  const onChange = vi.fn();
  render(
    <PapyraEditor
      defaultEditorView="visual"
      blockAnchors="on-demand"
      onChange={onChange}
      onReady={(m) => { handle = m; }}
    />,
  );
  await waitFor(() => expect(handle).not.toBeNull());
  return { handle: handle as unknown as PapyraEditorRef, onChange };
}

const DOC = [
  "Things to buy: ^xkncpelm",
  "",
  "1. Ramen ^13fphj82",
  "    1. Sometsuke ^mpjbd9gz",
  "",
  "See [[Garden log]] ^p1aaaaaa",
].join("\n");

describe("PapyraEditor adopt → read", () => {
  it("returns the preset's own markdown immediately after setMarkdown", async () => {
    const { handle } = await mount();
    handle.setMarkdown(DOC);
    const md = handle.getMarkdown();
    expect(md).not.toContain("Unsupported");
    expect(md).toContain("^xkncpelm");
    expect(md).toContain("^mpjbd9gz");
    expect(md).toContain("[[Garden log]]");
  });

  it("does not report the adopted document as a user edit", async () => {
    const { handle, onChange } = await mount();
    handle.setMarkdown(DOC);
    const baseline = handle.getMarkdown();
    // Let any post-adopt commits (transforms, decorator mounts) settle.
    await new Promise((r) => setTimeout(r, 50));
    const userEdits = onChange.mock.calls
      .map(([e]) => e as { source: string; markdown: string })
      .filter((e) => e.source === "user" && e.markdown !== baseline);
    expect(userEdits).toEqual([]);
    expect(handle.getMarkdown()).toBe(baseline);
  });
});

/*
 * Blank lines and literal text through the real preset: a note is adopted,
 * read back, adopted again (the host's save → reopen), and must not change.
 * The first case is the one a user hit: an empty line typed between a nested
 * list and the next line disappeared after leaving and reopening the note.
 */
describe("PapyraEditor save → reopen keeps what was typed", () => {
  const NOTES: [string, string][] = [
    ["blank line after a nested list", [
      "Things to buy:", "", "1. Ramen Bowl Set (Bowl, Spoon, Etc.)", "    1. Sometsuke", "    2. Mino-yaki",
      "2. Whiskey", "    1. Yamazaki 12yr", "    2. Hibiki Master Select", "", "",
      "Things to experience:", "", "1. Meiji Jingu Gaien Ginkgo Avenue, Tokyo",
    ].join("\n")],
    ["blank lines with block anchors", "Intro ^aaaaaaaa\n\n\n\nOutro ^bbbbbbbb"],
    ["leading and trailing blank lines", "\n\nBody\n\n\n"],
    ["literal syntax kept as text", "&#35; not a heading\n\n1&#46; not a list\n\nsee &#91;x](y) and &#38;#35;"],
    ["an empty line inside a paragraph", "one\n&#8203;\nthree"],
    ["code with blank lines and a fence inside", "````\nx\n\n```\ny\n````"],
    ["wikilinks around blank lines", "[[Garden log]]\n\n\nafter"],
    ["escaped stars in plain text", "a \\* b \\* c and 2\\*3"],
    ["bold with inner spaces and a literal star", "x **bold** y \\*not bold\\*"],
    ["inline code with a backtick and edge spaces", "use `` a`b `` and `  padded  `"],
    ["a checklist and a literal box", "- [ ] real task\n\n&#91; ] not a task"],
  ];

  for (const [name, note] of NOTES) {
    it(name, async () => {
      const { handle } = await mount();
      handle.setMarkdown(note);
      const saved = handle.getMarkdown();
      expect(saved).toBe(note);
      handle.setMarkdown(saved);
      expect(handle.getMarkdown()).toBe(saved);
    });
  }
});

/*
 * Pasting markdown formats it as if it had been typed: `## Text` arrives as a
 * heading, not as the literal characters. Through the real preset, so the
 * extension is proven to be wired in and to read the preset's own syntax.
 */
describe("PapyraEditor pasted markdown", () => {
  // jsdom has no layout; Lexical measures the caret after a paste to scroll it into view.
  beforeAll(() => {
    const rect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
    const targets = [Range.prototype, Text.prototype] as { getBoundingClientRect?: () => unknown }[];
    for (const target of targets) {
      if (!target.getBoundingClientRect) target.getBoundingClientRect = rect;
    }
  });

  async function pasteInto(container: HTMLElement, text: string, html = "") {
    const root = container.querySelector<HTMLElement>("[contenteditable='true']");
    expect(root).not.toBeNull();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    const data: Record<string, string> = { "text/plain": text, "text/html": html };
    Object.defineProperty(event, "clipboardData", {
      value: {
        types: Object.keys(data).filter((type) => data[type]),
        files: [],
        getData: (type: string) => data[type] ?? "",
      },
    });
    root!.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve, 30));
    return event;
  }

  async function mountEmpty() {
    let handle: PapyraEditorRef | null = null;
    const { container } = render(
      <PapyraEditor defaultEditorView="visual" onReady={(m) => { handle = m; }} />,
    );
    await waitFor(() => expect(handle).not.toBeNull());
    const editor = (handle as unknown as PapyraEditorRef).getLexicalEditor();
    editor?.focus();
    return { container, handle: handle as unknown as PapyraEditorRef };
  }

  it("turns a pasted ## heading into a heading", async () => {
    const { container, handle } = await mountEmpty();
    const event = await pasteInto(container, "## Text");
    expect(event.defaultPrevented).toBe(true);
    expect(handle.getMarkdown().trim()).toBe("## Text");
    expect(container.querySelector("h2")?.textContent).toBe("Text");
  });

  it("formats lists, bold and the preset's own [[wikilinks]]", async () => {
    const { container, handle } = await mountEmpty();
    await pasteInto(container, "- one\n- **two** and [[Garden log]]");
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("li strong")?.textContent).toBe("two");
    expect(handle.getMarkdown()).toContain("[[Garden log]]");
  });

  it("puts a pasted heading on its own line after existing text", async () => {
    const { container, handle } = await mountEmpty();
    handle.setMarkdown("Hello");
    const editor = handle.getLexicalEditor();
    editor?.update(() => {
      $getRoot().selectEnd();
    }, { discrete: true });
    await pasteInto(container, "## Title");
    expect(handle.getMarkdown().trim()).toBe("Hello\n\n## Title");
  });

  it("leaves formatted web content to the editor", async () => {
    // The clipboard's own formatting wins over markdown-looking plain text.
    const rich = await mountEmpty();
    await pasteInto(rich.container, "## Plain", "<h3>Rich</h3>");
    expect(rich.container.querySelector("h2")).toBeNull();
    expect(rich.handle.getMarkdown()).not.toContain("## Plain");
  });
});

describe("PapyraEditor draggableBlocks (real editor)", () => {
  async function mountWith(props: { draggableBlocks?: boolean }) {
    let handle: PapyraEditorRef | null = null;
    const { container } = render(
      <PapyraEditor defaultEditorView="visual" {...props} onReady={(m) => { handle = m; }} />,
    );
    await waitFor(() => expect(handle).not.toBeNull());
    return { container, handle: handle as unknown as PapyraEditorRef };
  }

  it("has no drag handle by default", async () => {
    const { container } = await mountWith({});
    expect(container.querySelector(".luthor-editor")).toHaveClass("luthor-editor--draggable-disabled");
  });

  it("turns the drag handle on when the host opts in — and the body still round-trips", async () => {
    const { container, handle } = await mountWith({ draggableBlocks: true });
    await waitFor(() => expect(container.querySelector(".luthor-editor")).not.toHaveClass("luthor-editor--draggable-disabled"));
    const doc = ["# Heading", "", "- [ ] a todo", "- [x] done", "", "Paragraph with [[Garden log]].", "", "```js", "const x = 1;", "```"].join("\n");
    handle.setMarkdown(doc);
    const md = handle.getMarkdown();
    expect(md).not.toContain("Unsupported");
    expect(md).toContain("# Heading");
    expect(md).toContain("- [ ] a todo");
    expect(md).toContain("[[Garden log]]");
    expect(md).toContain("const x = 1;");
  });
});
