/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { jsonToMarkdown, markdownToJSON } from "../../core/markdown";
import {
  BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
  BlockAnchorNode,
  FILE_EMBED_MARKDOWN_TRANSFORMER,
  FileEmbedNode,
  TRANSCLUSION_MARKDOWN_TRANSFORMER,
  TransclusionNode,
  WIKILINK_MARKDOWN_TRANSFORMER,
  WikilinkNode,
} from "./index";

const BRIDGE_OPTIONS = {
  metadataMode: "none" as const,
  extraNodes: [FileEmbedNode, WikilinkNode, TransclusionNode, BlockAnchorNode],
  extraTransformers: [
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
