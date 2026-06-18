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
} from "../embeds";
import {
  IFRAME_EMBED_MARKDOWN_TRANSFORMER,
  IframeEmbedNode,
} from "./IframeEmbedExtension";
import {
  YOUTUBE_EMBED_MARKDOWN_TRANSFORMER,
  YouTubeEmbedNode,
} from "./YouTubeEmbedExtension";

/*
 * Lossless markdown round-trip for the shared iframe/YouTube media embeds
 * (Papyra Sprint 1.5). These nodes previously only serialized to HTML; the
 * transformers added here give them a byte-stable `![[youtube:…]]` /
 * `![[iframe:…]]` markdown form so a markdown-native preset (Papyra) can persist
 * them without rewriting the user's body. The `youtube:`/`iframe:` prefixed
 * transformers must be ordered ahead of the general file-embed transformer,
 * mirroring the saved-card precedence.
 */
const BRIDGE_OPTIONS = {
  metadataMode: "none" as const,
  extraNodes: [YouTubeEmbedNode, IframeEmbedNode, FileEmbedNode],
  extraTransformers: [
    YOUTUBE_EMBED_MARKDOWN_TRANSFORMER,
    IFRAME_EMBED_MARKDOWN_TRANSFORMER,
    FILE_EMBED_MARKDOWN_TRANSFORMER,
  ],
};

function roundTrip(markdown: string): string {
  const document = markdownToJSON(markdown, BRIDGE_OPTIONS);
  return jsonToMarkdown(document, BRIDGE_OPTIONS).trim();
}

describe("media embed markdown transformers", () => {
  // ── YouTube ──────────────────────────────────────────────────────────

  it("round-trips a canonical YouTube embed losslessly", () => {
    const source = "![[youtube:https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ]]";
    expect(roundTrip(source)).toBe(source);
  });

  it("normalizes a watch URL to the embed form, then stays idempotent", () => {
    const once = roundTrip("![[youtube:https://www.youtube.com/watch?v=dQw4w9WgXcQ]]");
    expect(once).toBe(
      "![[youtube:https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ]]",
    );
    expect(roundTrip(once)).toBe(once);
  });

  it("round-trips a YouTube embed caption losslessly", () => {
    const source =
      "![[youtube:https://www.youtube-nocookie.com/embed/abc123|My talk]]";
    expect(roundTrip(source)).toBe(source);
  });

  it("parses a YouTube embed into a youtube-embed node, not a file embed", () => {
    const serialized = JSON.stringify(
      markdownToJSON(
        "![[youtube:https://www.youtube.com/embed/abc123]]",
        BRIDGE_OPTIONS,
      ),
    );
    expect(serialized).toContain('"type":"youtube-embed"');
    expect(serialized).not.toContain('"type":"fileEmbed"');
  });

  // ── Iframe ───────────────────────────────────────────────────────────

  it("round-trips an iframe embed losslessly", () => {
    const source = "![[iframe:https://example.com/widget]]";
    expect(roundTrip(source)).toBe(source);
  });

  it("round-trips an iframe embed caption losslessly", () => {
    const source = "![[iframe:https://example.com/widget|Live demo]]";
    expect(roundTrip(source)).toBe(source);
  });

  it("normalizes a protocol-less iframe URL, then stays idempotent", () => {
    const once = roundTrip("![[iframe:example.com/embed]]");
    expect(once).toBe("![[iframe:https://example.com/embed]]");
    expect(roundTrip(once)).toBe(once);
  });

  it("parses an iframe embed into an iframe-embed node, not a file embed", () => {
    const serialized = JSON.stringify(
      markdownToJSON("![[iframe:https://example.com]]", BRIDGE_OPTIONS),
    );
    expect(serialized).toContain('"type":"iframe-embed"');
    expect(serialized).not.toContain('"type":"fileEmbed"');
  });

  // ── Coexistence ──────────────────────────────────────────────────────

  it("leaves an ordinary file embed untouched alongside media embeds", () => {
    const source =
      "![[diagram.png]]\n\n![[youtube:https://www.youtube-nocookie.com/embed/abc123]]\n\n![[iframe:https://example.com/x]]";
    const once = roundTrip(source);
    expect(once).toBe(source);
    expect(roundTrip(once)).toBe(once);
  });
});
