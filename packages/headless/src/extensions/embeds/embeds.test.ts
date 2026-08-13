/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  createEditor,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
} from "lexical";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { $createListItemNode, ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { jsonToMarkdown, markdownToJSON } from "../../core/markdown";
import {
  $isBlockAnchorNode,
  BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
  BlockAnchorNode,
  ensureBlockAnchors,
  registerBlockAnchorTrailingGuard,
  CALLOUT_MARKDOWN_TRANSFORMER,
  CalloutNode,
  FILE_EMBED_MARKDOWN_TRANSFORMER,
  FileEmbedNode,
  SAVED_CARD_MARKDOWN_TRANSFORMER,
  SavedCardNode,
  TRANSCLUSION_MARKDOWN_TRANSFORMER,
  TransclusionNode,
  WIKILINK_MARKDOWN_TRANSFORMER,
  WikilinkNode,
} from "./index";

const BRIDGE_OPTIONS = {
  metadataMode: "none" as const,
  extraNodes: [
    FileEmbedNode,
    SavedCardNode,
    CalloutNode,
    WikilinkNode,
    TransclusionNode,
    BlockAnchorNode,
  ],
  extraTransformers: [
    SAVED_CARD_MARKDOWN_TRANSFORMER,
    CALLOUT_MARKDOWN_TRANSFORMER,
    TRANSCLUSION_MARKDOWN_TRANSFORMER,
    FILE_EMBED_MARKDOWN_TRANSFORMER,
    BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
    WIKILINK_MARKDOWN_TRANSFORMER,
  ],
};

function roundTrip(markdown: string): string {
  const document = markdownToJSON(markdown, BRIDGE_OPTIONS);
  return jsonToMarkdown(document, BRIDGE_OPTIONS).trim();
}

/**
 * Editor loaded with the given markdown, for stamping passes. A root element
 * is attached because a plain `createEditor` without one never commits its
 * pending updates (the live presets always have a mounted root).
 */
function createStampEditor(markdown: string): LexicalEditor {
  const editor = createEditor({
    namespace: "embeds-test",
    nodes: [
      BlockAnchorNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
    ],
    onError: (error) => {
      throw error;
    },
  });
  const root = window.document.createElement("div");
  root.contentEditable = "true";
  window.document.body.appendChild(root);
  editor.setRootElement(root);

  const document = markdownToJSON(markdown, BRIDGE_OPTIONS);
  editor.setEditorState(editor.parseEditorState(JSON.stringify(document)));
  return editor;
}

function editorMarkdown(editor: LexicalEditor): string {
  return jsonToMarkdown(editor.getEditorState().toJSON(), BRIDGE_OPTIONS).trim();
}

describe("papyra embed transformers", () => {
  // ── File embeds ──────────────────────────────────────────────────────

  it("round-trips a file embed losslessly", () => {
    expect(roundTrip("![[diagram.png]]")).toBe("![[diagram.png]]");
  });

  it("round-trips non-image file embeds verbatim", () => {
    expect(roundTrip("![[notes.pdf]]")).toBe("![[notes.pdf]]");
    expect(roundTrip("![[clip.mp4]]")).toBe("![[clip.mp4]]");
  });

  // ── Wikilinks ────────────────────────────────────────────────────────

  it("round-trips an inline wikilink losslessly", () => {
    expect(roundTrip("See [[Project Plan]] for details.")).toBe(
      "See [[Project Plan]] for details.",
    );
  });

  it("round-trips an aliased wikilink losslessly", () => {
    expect(roundTrip("Read [[Project Plan|the plan]] now.")).toBe(
      "Read [[Project Plan|the plan]] now.",
    );
  });

  // ── Transclusions ───────────────────────────────────────────────────

  it("round-trips a transclusion embed losslessly", () => {
    expect(roundTrip("![[Meeting Notes#^abc123]]")).toBe(
      "![[Meeting Notes#^abc123]]",
    );
  });

  it("round-trips a transclusion with a hyphenated block id", () => {
    expect(roundTrip("![[Daily Log#^ref-42]]")).toBe(
      "![[Daily Log#^ref-42]]",
    );
  });

  it("parses a transclusion into a transclusion node, not a file embed", () => {
    const document = markdownToJSON(
      "![[Note#^block1]]",
      BRIDGE_OPTIONS,
    );
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"type":"transclusion"');
    expect(serialized).not.toContain('"type":"fileEmbed"');
  });

  it("persists note and blockId on the serialized transclusion node", () => {
    const document = markdownToJSON(
      "![[My Note#^xyz]]",
      BRIDGE_OPTIONS,
    );
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"note":"My Note"');
    expect(serialized).toContain('"blockId":"xyz"');
  });

  // ── Block anchors ──────────────────────────────────────────────────

  it("round-trips a paragraph with a trailing block anchor", () => {
    expect(roundTrip("Some paragraph text ^block1")).toBe(
      "Some paragraph text ^block1",
    );
  });

  it("round-trips a block anchor with hyphens and underscores", () => {
    expect(roundTrip("Content here ^my_block-42")).toBe(
      "Content here ^my_block-42",
    );
  });

  it("parses a trailing block anchor into a blockAnchor node", () => {
    const document = markdownToJSON(
      "Hello world ^anchor1",
      BRIDGE_OPTIONS,
    );
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"type":"blockAnchor"');
    expect(serialized).toContain('"blockId":"anchor1"');
  });

  it("round-trips a mid-document block anchor losslessly", () => {
    const markdown = "First block. ^a1\n\nMiddle without anchor.\n\nLast block. ^z9";
    expect(roundTrip(markdown)).toBe(markdown);
  });

  // ── Block anchor stamping ──────────────────────────────────────────

  const ANCHORED_LINE = / \^[a-z0-9]{8}$/;

  it("stamps a distinct anchor on every top-level paragraph", () => {
    const editor = createStampEditor("One\n\nTwo\n\nThree");
    ensureBlockAnchors(editor);

    const lines = editorMarkdown(editor)
      .split("\n")
      .filter((line) => line.trim().length > 0);
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line).toMatch(ANCHORED_LINE);
    }

    const ids = lines.map((line) => line.slice(line.lastIndexOf("^") + 1));
    expect(new Set(ids).size).toBe(3);
  });

  it("keeps existing anchor ids stable across repeated stamping", () => {
    const editor = createStampEditor("One\n\nTwo ^kept0042\n\nThree");
    ensureBlockAnchors(editor);
    const first = editorMarkdown(editor);
    expect(first).toContain("Two ^kept0042");

    // Stamping again is a no-op: ids never churn.
    ensureBlockAnchors(editor);
    expect(editorMarkdown(editor)).toBe(first);
  });

  it("survives a remount round-trip with ids unchanged", () => {
    const editor = createStampEditor("Alpha\n\nBeta\n\nGamma");
    ensureBlockAnchors(editor);
    const stamped = editorMarkdown(editor);

    // Re-mounting from the stamped markdown (parse → serialize) is lossless,
    // and re-running the stamp adds nothing.
    expect(roundTrip(stamped)).toBe(stamped);
    const remounted = createStampEditor(stamped);
    ensureBlockAnchors(remounted);
    expect(editorMarkdown(remounted)).toBe(stamped);
  });

  it("re-stamps duplicated ids so anchors stay unique per document", () => {
    const editor = createStampEditor("Original ^dupe1234\n\nPasted copy ^dupe1234");
    ensureBlockAnchors(editor);

    const markdown = editorMarkdown(editor);
    // The first occurrence keeps its id; the duplicate gets a fresh one.
    expect(markdown).toContain("Original ^dupe1234");
    expect(markdown).not.toContain("Pasted copy ^dupe1234");
    expect(markdown.split("^dupe1234")).toHaveLength(2);
  });

  it("stamps headings and quotes but leaves empty blocks alone", () => {
    const editor = createStampEditor("# Heading\n\n> Quoted line\n\nBody");
    ensureBlockAnchors(editor);

    const markdown = editorMarkdown(editor);
    expect(markdown).toMatch(/^# Heading \^[a-z0-9]{8}$/m);
    expect(markdown).toMatch(/^> Quoted line \^[a-z0-9]{8}$/m);
    expect(markdown).toMatch(/^Body \^[a-z0-9]{8}$/m);
  });

  it("leaves tables and code blocks unanchored", () => {
    const editor = createStampEditor("```js\nconst a = 1;\n```");
    ensureBlockAnchors(editor);

    expect(editorMarkdown(editor)).not.toMatch(/\^[a-z0-9]{8}/);
  });

  // ── List anchoring ─────────────────────────────────────────────────
  //
  // A mention typed in a list item is resolved through that line's anchor, so
  // list items have to be stampable — otherwise the `@` menu invites a mention
  // that can never be delivered. `- item ^id` is valid markdown and survives
  // the bridge verbatim, which is what makes this safe.

  it("stamps every list item, including a checklist", () => {
    const editor = createStampEditor("- One\n- Two\n\n- [ ] Task\n- [x] Done");
    ensureBlockAnchors(editor);

    const markdown = editorMarkdown(editor);
    expect(markdown).toMatch(/^- One \^[a-z0-9]{8}$/m);
    expect(markdown).toMatch(/^- Two \^[a-z0-9]{8}$/m);
    expect(markdown).toMatch(/^- \[ \] Task \^[a-z0-9]{8}$/m);
    expect(markdown).toMatch(/^- \[x\] Done \^[a-z0-9]{8}$/m);
  });

  it("stamps an ordered list", () => {
    const editor = createStampEditor("1. First\n2. Second");
    ensureBlockAnchors(editor);

    const markdown = editorMarkdown(editor);
    expect(markdown).toMatch(/^1\. First \^[a-z0-9]{8}$/m);
    expect(markdown).toMatch(/^2\. Second \^[a-z0-9]{8}$/m);
  });

  it("stamps nested list items on the item itself, not its wrapper", () => {
    const editor = createStampEditor("- Parent\n    - Child");
    ensureBlockAnchors(editor);

    const markdown = editorMarkdown(editor);
    expect(markdown).toMatch(/^- Parent \^[a-z0-9]{8}$/m);
    expect(markdown).toMatch(/^ {4}- Child \^[a-z0-9]{8}$/m);

    // One anchor per rendered line: the item that only wraps the nested list
    // is walked through, never stamped.
    const anchors = markdown.match(/\^[a-z0-9]{8}/g) ?? [];
    expect(anchors).toHaveLength(2);
    expect(new Set(anchors).size).toBe(2);
  });

  it("keeps list anchors stable and lossless across a round-trip", () => {
    const editor = createStampEditor(
      "- One\n- [ ] Task\n\n1. First\n\n- Parent\n    - Child",
    );
    ensureBlockAnchors(editor);
    const stamped = editorMarkdown(editor);

    expect(roundTrip(stamped)).toBe(stamped);

    const remounted = createStampEditor(stamped);
    ensureBlockAnchors(remounted);
    expect(editorMarkdown(remounted)).toBe(stamped);
  });

  it("round-trips a list item whose own text ends in anchor-like markup", () => {
    // Indistinguishable from a real anchor by design (same as a paragraph):
    // what matters is that the text survives the round-trip byte for byte and
    // a stamping pass does not add a second one.
    const markdown = "- see ^v2";
    expect(roundTrip(markdown)).toBe(markdown);

    const editor = createStampEditor(markdown);
    ensureBlockAnchors(editor);
    expect(editorMarkdown(editor)).toBe(markdown);
  });

  it("gives an empty list item no anchor", () => {
    // Built by hand: a trailing `- ` line does not survive the markdown bridge
    // as an empty item, but pressing Enter in a list produces one.
    const editor = createStampEditor("- One");
    editor.update(
      () => {
        const list = $getRoot().getFirstChild();
        if (!$isElementNode(list)) {
          throw new Error("Expected a list");
        }
        list.append($createListItemNode());
      },
      { discrete: true },
    );

    ensureBlockAnchors(editor);

    const markdown = editorMarkdown(editor);
    expect(markdown).toMatch(/^- One \^[a-z0-9]{8}$/m);
    expect(markdown.match(/\^[a-z0-9]{8}/g) ?? []).toHaveLength(1);
  });

  // ── Stranded anchors (id corruption regression) ─────────────────────
  //
  // The anchor renders nothing, so a caret at the visual end of an anchored
  // line can sit on its far side. Text typed there becomes a sibling *after*
  // the anchor and used to serialize glued onto the id (`^sc36ih7scc`), which
  // renames the block and dangles every `![[Note#^sc36ih7s]]` pointing at it.

  /** Append text after the block's trailing anchor, as stranded typing does. */
  function typeAfterAnchor(
    editor: LexicalEditor,
    blockIndex: number,
    text: string,
  ): void {
    editor.update(
      () => {
        const block = $getRoot().getChildren()[blockIndex];
        if (!$isElementNode(block)) {
          throw new Error(`Block ${blockIndex} is not an element`);
        }
        const anchor = block
          .getChildren()
          .find((child) => $isBlockAnchorNode(child));
        if (!anchor) {
          throw new Error(`Block ${blockIndex} has no anchor`);
        }
        anchor.insertAfter($createTextNode(text));
      },
      { discrete: true },
    );
  }

  it("keeps the block id when typing stranded text after the anchor", () => {
    const editor = createStampEditor("Ship ^sc36ih7s");
    typeAfterAnchor(editor, 0, "cc");

    ensureBlockAnchors(editor);
    const markdown = editorMarkdown(editor);

    // The id is byte-identical, and still the 8 characters
    // `createBlockAnchorId` emits — never the glued `^sc36ih7scc`.
    expect(markdown).toBe("Shipcc ^sc36ih7s");
    expect(markdown).toMatch(ANCHORED_LINE);
    expect(markdown).not.toContain("^sc36ih7scc");
  });

  it("never glues typed text onto the id even without a stamping pass", () => {
    const editor = createStampEditor("Ship ^sc36ih7s");
    typeAfterAnchor(editor, 0, "cc");

    // Serializing a stranded anchor degrades to a stray token, never a
    // renamed block: the id stays readable and intact.
    expect(editorMarkdown(editor)).not.toContain("^sc36ih7scc");
    expect(editorMarkdown(editor)).toContain("^sc36ih7s");
  });

  it("repairs a stranded anchor to exactly one anchor across a round-trip", () => {
    const editor = createStampEditor("Ship ^sc36ih7s");
    typeAfterAnchor(editor, 0, "cc");
    ensureBlockAnchors(editor);

    const repaired = editorMarkdown(editor);
    expect(roundTrip(repaired)).toBe(repaired);

    // Re-importing and re-stamping must not append a second anchor — the
    // double-stamp that used to leave `Shipcc ^sc36ih7scc ^42ad9l0l` on disk.
    const remounted = createStampEditor(repaired);
    ensureBlockAnchors(remounted);
    const restamped = editorMarkdown(remounted);

    expect(restamped).toBe(repaired);
    expect(restamped.match(/\^/g)).toHaveLength(1);
  });

  it("repairs only the edited block and leaves other ids byte-identical", () => {
    const editor = createStampEditor(
      "First ^aaa11111\n\nSecond ^bbb22222\n\nThird ^ccc33333",
    );
    typeAfterAnchor(editor, 1, " tail");
    ensureBlockAnchors(editor);

    const lines = editorMarkdown(editor)
      .split("\n")
      .filter((line) => line.trim().length > 0);

    expect(lines[0]).toBe("First ^aaa11111");
    expect(lines[1]).toBe("Second tail ^bbb22222");
    expect(lines[2]).toBe("Third ^ccc33333");
  });

  it("re-stamps a duplicated id and still leaves the anchor trailing", () => {
    const editor = createStampEditor("Original ^dupe1234\n\nCopy ^dupe1234");
    typeAfterAnchor(editor, 1, " more");
    ensureBlockAnchors(editor);

    const lines = editorMarkdown(editor)
      .split("\n")
      .filter((line) => line.trim().length > 0);

    expect(lines[0]).toBe("Original ^dupe1234");
    expect(lines[1]).toMatch(/^Copy more \^[a-z0-9]{8}$/);
    expect(lines[1]).not.toContain("dupe1234");
  });

  // ── Trailing guard (caret + live repair) ────────────────────────────

  /** A stamping editor with the live trailing guard registered. */
  function createGuardedEditor(markdown: string): LexicalEditor {
    const editor = createStampEditor(markdown);
    registerBlockAnchorTrailingGuard(editor);
    return editor;
  }

  /** Put the collapsed caret at the very end of a block, past its anchor. */
  function selectPastAnchor(editor: LexicalEditor, blockIndex: number): void {
    editor.update(
      () => {
        const block = $getRoot().getChildren()[blockIndex];
        if (!$isElementNode(block)) {
          throw new Error(`Block ${blockIndex} is not an element`);
        }
        const end = block.getChildrenSize();
        block.select(end, end);
      },
      { discrete: true },
    );
  }

  it("snaps a caret resting after the anchor back in front of it", () => {
    const editor = createGuardedEditor("Ship ^sc36ih7s");
    selectPastAnchor(editor, 0);

    editor.dispatchCommand(SELECTION_CHANGE_COMMAND, undefined);
    editor.update(() => {}, { discrete: true });

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        throw new Error("Expected a range selection");
      }
      const node = selection.anchor.getNode();
      expect($isTextNode(node)).toBe(true);
      expect(node.getTextContent()).toBe("Ship");
      expect(selection.anchor.offset).toBe(4);
      expect($isBlockAnchorNode(node.getNextSibling())).toBe(true);
    });
  });

  it("types into the line, not past the anchor, once the caret is normalized", () => {
    const editor = createGuardedEditor("Ship ^sc36ih7s");
    selectPastAnchor(editor, 0);
    editor.dispatchCommand(SELECTION_CHANGE_COMMAND, undefined);

    editor.update(
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText("cc");
        }
      },
      { discrete: true },
    );

    expect(editorMarkdown(editor)).toBe("Shipcc ^sc36ih7s");
  });

  it("moves an anchor back to the end when text lands after it", () => {
    const editor = createGuardedEditor("Ship ^sc36ih7s");
    typeAfterAnchor(editor, 0, "cc");

    // No stamping pass: the guard's transform repairs the block as the text
    // is committed, so even an unsaved document never holds a stranded anchor.
    expect(editorMarkdown(editor)).toBe("Shipcc ^sc36ih7s");
  });

  // ── Saved web cards ─────────────────────────────────────────────────

  it("round-trips a saved card losslessly", () => {
    expect(roundTrip("![[card:https://example.com]]")).toBe(
      "![[card:https://example.com]]",
    );
  });

  it("round-trips a saved card with a title losslessly", () => {
    expect(
      roundTrip("![[card:https://example.com/page?q=1|Example Page]]"),
    ).toBe("![[card:https://example.com/page?q=1|Example Page]]");
  });

  it("parses a saved card into a savedCard node, not a file embed", () => {
    const document = markdownToJSON(
      "![[card:https://example.com]]",
      BRIDGE_OPTIONS,
    );
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"type":"savedCard"');
    expect(serialized).not.toContain('"type":"fileEmbed"');
  });

  it("persists the verbatim url and title on the serialized card node", () => {
    const document = markdownToJSON(
      "![[card:https://example.com|Docs]]",
      BRIDGE_OPTIONS,
    );
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"url":"https://example.com"');
    expect(serialized).toContain('"title":"Docs"');
  });

  it("omits the title key when a saved card has none", () => {
    const document = markdownToJSON(
      "![[card:https://example.com]]",
      BRIDGE_OPTIONS,
    );
    expect(JSON.stringify(document)).not.toContain('"title"');
  });

  it("is idempotent for saved-card-only bodies", () => {
    const source = "![[card:https://example.com/path|A Title]]";
    const once = roundTrip(source);
    expect(roundTrip(once)).toBe(once);
  });

  // ── Transcription callouts ──────────────────────────────────────────

  it("round-trips a transcription callout losslessly", () => {
    const source = "> [!transcript]\n> First line.\n> Second line.";
    expect(roundTrip(source)).toBe(source);
  });

  it("round-trips a callout with a title losslessly", () => {
    const source = "> [!transcript] Interview\n> Question one.";
    expect(roundTrip(source)).toBe(source);
  });

  it("round-trips a callout with a blank body line", () => {
    const source = "> [!transcript]\n> Para one.\n>\n> Para two.";
    expect(roundTrip(source)).toBe(source);
  });

  it("round-trips a header-only callout", () => {
    expect(roundTrip("> [!transcript]")).toBe("> [!transcript]");
  });

  it("parses a callout into a callout node, not a quote", () => {
    const document = markdownToJSON(
      "> [!transcript]\n> hello",
      BRIDGE_OPTIONS,
    );
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"type":"callout"');
    expect(serialized).not.toContain('"type":"quote"');
  });

  it("persists the header tail and body on the serialized callout node", () => {
    const document = markdownToJSON(
      "> [!transcript] Title\n> line one",
      BRIDGE_OPTIONS,
    );
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"headerTail":" Title"');
    expect(serialized).toContain('"line one"');
  });

  it("normalizes the callout marker case but stays idempotent after", () => {
    // The marker is normalised to lowercase on the first pass (matching the
    // checklist/alert case convention); every pass after it is byte-stable.
    const once = roundTrip("> [!TRANSCRIPT]\n> body");
    expect(once).toBe("> [!transcript]\n> body");
    expect(roundTrip(once)).toBe(once);
  });

  it("leaves an ordinary quote as a quote", () => {
    const document = markdownToJSON("> just a quote", BRIDGE_OPTIONS);
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"type":"quote"');
    expect(serialized).not.toContain('"type":"callout"');
  });

  it("is idempotent for callout-only bodies", () => {
    const source = "> [!transcript] Notes\n> alpha\n>\n> beta";
    const once = roundTrip(source);
    expect(roundTrip(once)).toBe(once);
  });

  // ── Disambiguation ──────────────────────────────────────────────────

  it("does not mistake a file embed for a wikilink", () => {
    const document = markdownToJSON("![[diagram.png]]", BRIDGE_OPTIONS);
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"type":"fileEmbed"');
    expect(serialized).not.toContain('"type":"wikilink"');
  });

  it("parses a standalone wikilink into a wikilink node", () => {
    const document = markdownToJSON("[[Note]]", BRIDGE_OPTIONS);
    expect(JSON.stringify(document)).toContain('"type":"wikilink"');
  });

  it("persists the verbatim target and alias on the serialized node", () => {
    const document = markdownToJSON("[[Target|Alias]]", BRIDGE_OPTIONS);
    const serialized = JSON.stringify(document);
    expect(serialized).toContain('"target":"Target"');
    expect(serialized).toContain('"alias":"Alias"');
  });

  it("omits the alias key when a wikilink has none", () => {
    const document = markdownToJSON("[[Target]]", BRIDGE_OPTIONS);
    expect(JSON.stringify(document)).not.toContain('"alias"');
  });

  // ── Idempotency ────────────────────────────────────────────────────

  it("is idempotent across repeated round-trips", () => {
    const source =
      "![[diagram.png]]\n\nSee [[Note|alias]] and [[Other]].\n\n![[Ref#^block1]]\n\nText ^anchor2";
    const once = roundTrip(source);
    expect(roundTrip(once)).toBe(once);
  });

  it("is idempotent for transclusion-only bodies", () => {
    const source = "![[Project#^summary]]";
    const once = roundTrip(source);
    expect(roundTrip(once)).toBe(once);
  });

  it("is idempotent for block-anchor-only paragraphs", () => {
    const source = "Just a note ^id99";
    const once = roundTrip(source);
    expect(roundTrip(once)).toBe(once);
  });
});

/*
 * Property / fuzz hardening (Sprint 1.6).
 *
 * The single-case tests above pin specific shapes; these generate many random
 * bodies that mix every embed with ordinary markdown and assert the two release
 * invariants the preset stakes its `.md` safety on:
 *
 *   1. Idempotency — `roundTrip(roundTrip(x)) === roundTrip(x)`. The first pass
 *      may normalise spacing; every pass after it must be byte-stable, so an
 *      autosave loop can never rewrite the user's body.
 *   2. No frontmatter envelope — with `metadataMode: "none"` the bridge must
 *      never emit a leading `---\n…\n---` block, regardless of body content.
 *
 * The generator is seeded (deterministic), so a failure reproduces from the
 * printed seed rather than flaking in CI.
 */
describe("papyra embed transformers — property/fuzz round-trip", () => {
  /** Deterministic PRNG (mulberry32) so failures reproduce from the seed. */
  function createRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const NOTES = ["Project Plan", "Daily Log", "Meeting Notes", "Inbox", "README"];
  const ALIASES = ["the plan", "today", "notes", "here"];
  const FILES = ["diagram.png", "clip.mp4", "audio.mp3", "notes.pdf", "photo.jpeg"];
  const IDS = ["abc123", "ref-42", "block_1", "summary", "id99"];
  const WORDS = ["alpha", "beta", "gamma", "delta", "note", "draft", "idea"];
  const URLS = [
    "https://example.com",
    "https://example.org/path?q=1",
    "https://docs.example.com/a/b",
  ];

  /** Block generators — each returns a body fragment that round-trips. */
  const BLOCKS: Array<(pick: <T>(items: T[]) => T) => string> = [
    (pick) => `![[${pick(FILES)}]]`,
    (pick) => `[[${pick(NOTES)}]]`,
    (pick) => `[[${pick(NOTES)}|${pick(ALIASES)}]]`,
    (pick) => `![[${pick(NOTES)}#^${pick(IDS)}]]`,
    (pick) => `![[card:${pick(URLS)}]]`,
    (pick) => `![[card:${pick(URLS)}|${pick(WORDS)} ${pick(WORDS)}]]`,
    (pick) => `${pick(WORDS)} ${pick(WORDS)} ^${pick(IDS)}`,
    (pick) => `# ${pick(WORDS)} ${pick(WORDS)}`,
    (pick) => `## ${pick(WORDS)}`,
    (pick) => `${pick(WORDS)} ${pick(WORDS)} ${pick(WORDS)}.`,
    (pick) => `See [[${pick(NOTES)}]] and [[${pick(NOTES)}|${pick(ALIASES)}]].`,
    (pick) => `> ${pick(WORDS)} ${pick(WORDS)}`,
    (pick) =>
      `> [!transcript] ${pick(WORDS)}\n> ${pick(WORDS)} ${pick(WORDS)}\n> ${pick(WORDS)}`,
    (pick) => `> [!transcript]\n> ${pick(WORDS)} ${pick(WORDS)}`,
  ];

  it("is idempotent and frontmatter-free across 200 random bodies", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const random = createRandom(seed);
      const pick = <T>(items: T[]): T =>
        items[Math.floor(random() * items.length)] as T;

      const blockCount = 1 + Math.floor(random() * 6);
      const body = Array.from({ length: blockCount }, () =>
        pick(BLOCKS)(pick),
      ).join("\n\n");

      const once = roundTrip(body);

      // Stable from the first normalised pass onward — autosave never churns.
      expect(roundTrip(once), `idempotency failed for seed ${seed}: ${body}`).toBe(
        once,
      );

      // Never an emitted frontmatter envelope (metadataMode "none").
      expect(
        once.startsWith("---"),
        `frontmatter leaked for seed ${seed}: ${once}`,
      ).toBe(false);
    }
  });

  it("never emits a frontmatter envelope even when the body opens with a rule", () => {
    // A leading thematic break is legitimate body content, not frontmatter; the
    // bridge must keep it as-is and never wrap the body in a YAML envelope.
    const once = roundTrip("Heading\n\n[[Note]] body ^anchor1");
    expect(once.startsWith("---")).toBe(false);
    expect(once).not.toMatch(/^---\n[\s\S]*\n---/);
  });
});
