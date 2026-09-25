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
import { describe, expect, it, vi } from "vitest";

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
