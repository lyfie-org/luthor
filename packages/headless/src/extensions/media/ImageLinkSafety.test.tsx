/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { createEditor } from "lexical";
import { ImageNode, $createImageNode } from "./ImageExtension";
import { ImageTranslator } from "./ImageTranslator";

/**
 * An image's linkHref comes straight from markdown
 * (`[![alt](img)](url)`) and — unlike LinkNode — nothing in Lexical
 * sanitizes it. The model keeps it verbatim for lossless round-trips;
 * these tests pin that only the DOM boundary is scheme-gated.
 */

function withEditor<T>(run: () => T): T {
  const editor = createEditor({
    namespace: "image-link-safety-test",
    nodes: [ImageNode],
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

function createLinkedImage(linkHref: string): ImageNode {
  return withEditor(() =>
    $createImageNode("https://example.com/pic.png", "alt", undefined, linkHref),
  );
}

describe("ImageNode linked-image DOM boundary", () => {
  it("exportDOM writes about:blank for a javascript: linkHref", () => {
    for (const hostile of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
    ]) {
      const node = createLinkedImage(hostile);
      const { element } = ImageTranslator.exportDOM(node);
      const anchor = (element as HTMLElement).querySelector("a");
      expect(anchor).not.toBeNull();
      expect(anchor!.getAttribute("href")).toBe("about:blank");
    }
  });

  it("keeps an http(s) linkHref on the exported anchor", () => {
    const node = createLinkedImage("https://example.com/page");
    const { element } = ImageTranslator.exportDOM(node);
    expect((element as HTMLElement).querySelector("a")!.getAttribute("href")).toBe(
      "https://example.com/page",
    );
  });

  it("keeps the raw linkHref in the model for lossless round-trips", () => {
    const node = createLinkedImage("javascript:alert(1)");
    const serialized = withEditor(() => ImageTranslator.exportJSON(node));
    expect(serialized.linkHref).toBe("javascript:alert(1)");
  });
});
