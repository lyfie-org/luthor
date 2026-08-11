/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { createEditor, type LexicalEditor } from "lexical";
import {
  IframeEmbedNode,
  toRenderableEmbedSrc,
  type IframeEmbedPayload,
} from "./IframeEmbedExtension";
import { YouTubeEmbedNode, type YouTubeEmbedPayload } from "./YouTubeEmbedExtension";

/**
 * The command-level insert/update paths already refuse non-http(s) URLs.
 * These tests cover the two paths that skip those commands — importJSON and
 * importDOM — by proving that whatever lands in the model, the src written
 * to a live iframe is inert unless it is http(s). The model itself keeps
 * the original value so a load/save cycle never rewrites the document.
 */

function withEditor<T>(run: () => T): T {
  const editor: LexicalEditor = createEditor({
    namespace: "embed-src-safety-test",
    nodes: [IframeEmbedNode, YouTubeEmbedNode],
    onError: (error) => {
      throw error;
    },
  });
  let result: T | undefined;
  editor.update(
    () => {
      result = run();
    },
    { discrete: true },
  );
  return result as T;
}

const HOSTILE_SRCS = [
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "vbscript:msgbox(1)",
  "JaVaScRiPt:alert(1)",
];

function iframePayload(src: string): IframeEmbedPayload {
  return { src, width: 640, height: 360, alignment: "center" };
}

function youtubePayload(src: string): YouTubeEmbedPayload {
  return { src, width: 640, height: 480, alignment: "center" };
}

describe("toRenderableEmbedSrc", () => {
  it("passes http(s) srcs through unchanged", () => {
    expect(toRenderableEmbedSrc("https://example.com/embed")).toBe(
      "https://example.com/embed",
    );
    expect(toRenderableEmbedSrc("http://example.com/embed")).toBe(
      "http://example.com/embed",
    );
  });

  it("neutralizes script schemes and link-only schemes", () => {
    for (const src of HOSTILE_SRCS) {
      expect(toRenderableEmbedSrc(src)).toBe("about:blank");
    }
    // Valid for links, meaningless (and therefore refused) for frames.
    expect(toRenderableEmbedSrc("mailto:person@example.com")).toBe("about:blank");
    expect(toRenderableEmbedSrc("tel:+15551234567")).toBe("about:blank");
  });
});

describe("IframeEmbedNode DOM boundary", () => {
  it("exportDOM writes about:blank for a hostile src that arrived via importJSON", () => {
    for (const src of HOSTILE_SRCS) {
      const { element } = withEditor(() =>
        IframeEmbedNode.importJSON({
          type: "iframe-embed",
          version: 1,
          ...iframePayload(src),
        }).exportDOM(),
      );
      expect(element.querySelector("iframe")!.getAttribute("src")).toBe("about:blank");
    }
  });

  it("keeps the original src in the model and JSON round-trip", () => {
    const serialized = withEditor(() =>
      IframeEmbedNode.importJSON({
        type: "iframe-embed",
        version: 1,
        ...iframePayload("javascript:alert(1)"),
      }).exportJSON(),
    );
    expect(serialized.src).toBe("javascript:alert(1)");
  });

  it("leaves a legitimate embed src untouched end to end", () => {
    const node = withEditor(() =>
      IframeEmbedNode.importJSON({
        type: "iframe-embed",
        version: 1,
        ...iframePayload("https://maps.example.com/embed?q=paris"),
      }),
    );
    const { element } = withEditor(() => node.exportDOM());
    expect(element.querySelector("iframe")!.getAttribute("src")).toBe(
      "https://maps.example.com/embed?q=paris",
    );
    expect(withEditor(() => node.exportJSON()).src).toBe(
      "https://maps.example.com/embed?q=paris",
    );
  });
});

describe("YouTubeEmbedNode DOM boundary", () => {
  it("exportDOM writes about:blank for a hostile src that arrived via importJSON", () => {
    for (const src of HOSTILE_SRCS) {
      const { element } = withEditor(() =>
        YouTubeEmbedNode.importJSON({
          type: "youtube-embed",
          version: 1,
          ...youtubePayload(src),
        }).exportDOM(),
      );
      expect(element.querySelector("iframe")!.getAttribute("src")).toBe("about:blank");
    }
  });

  it("keeps the original src in the JSON round-trip and passes real embeds through", () => {
    const hostile = withEditor(() =>
      YouTubeEmbedNode.importJSON({
        type: "youtube-embed",
        version: 1,
        ...youtubePayload("javascript:alert(1)"),
      }).exportJSON(),
    );
    expect(hostile.src).toBe("javascript:alert(1)");

    const legit = withEditor(() =>
      YouTubeEmbedNode.importJSON({
        type: "youtube-embed",
        version: 1,
        ...youtubePayload("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
      }).exportDOM(),
    );
    expect(legit.element.querySelector("iframe")!.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });
});
