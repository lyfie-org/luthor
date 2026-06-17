/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { jsonToMarkdown, markdownToJSON } from "../../core/markdown";
import {
  FILE_EMBED_MARKDOWN_TRANSFORMER,
  FileEmbedNode,
  WIKILINK_MARKDOWN_TRANSFORMER,
  WikilinkNode,
} from "./index";

const BRIDGE_OPTIONS = {
  metadataMode: "none" as const,
  extraNodes: [FileEmbedNode, WikilinkNode],
  extraTransformers: [
    FILE_EMBED_MARKDOWN_TRANSFORMER,
    WIKILINK_MARKDOWN_TRANSFORMER,
  ],
};

function roundTrip(markdown: string): string {
  const document = markdownToJSON(markdown, BRIDGE_OPTIONS);
  return jsonToMarkdown(document, BRIDGE_OPTIONS).trim();
}

describe("papyra embed transformers", () => {
  it("round-trips a file embed losslessly", () => {
    expect(roundTrip("![[diagram.png]]")).toBe("![[diagram.png]]");
  });

  it("round-trips non-image file embeds verbatim", () => {
    expect(roundTrip("![[notes.pdf]]")).toBe("![[notes.pdf]]");
    expect(roundTrip("![[clip.mp4]]")).toBe("![[clip.mp4]]");
  });

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

  it("is idempotent across repeated round-trips", () => {
    const source = "![[diagram.png]]\n\nSee [[Note|alias]] and [[Other]].";
    const once = roundTrip(source);
    expect(roundTrip(once)).toBe(once);
  });

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
});
