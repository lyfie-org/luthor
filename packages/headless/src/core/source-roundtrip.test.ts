/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IS_BOLD, IS_SUBSCRIPT } from "lexical";
import { htmlToJSON, jsonToHTML } from "./html";
import { jsonToMarkdown, markdownToJSON } from "./markdown";

type JsonNode = Record<string, unknown>;

type JsonDocument = {
  root: {
    children: JsonNode[];
  };
};

const README_CANONICAL_FIXTURE = readFileSync(
  resolve(process.cwd(), "src/core/__fixtures__/readme-canonical.md"),
  "utf8",
);

function findTopLevelNode(
  document: JsonDocument,
  type: string,
  index = 0,
): JsonNode | undefined {
  return document.root.children.filter((node) => node.type === type)[index];
}

function createCrossFormatFixture(): JsonDocument {
  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: null,
      children: [
        {
          type: "paragraph",
          version: 1,
          format: "",
          indent: 0,
          direction: null,
          children: [
            {
              type: "text",
              version: 1,
              text: "Alpha",
              detail: 0,
              format: IS_BOLD | IS_SUBSCRIPT,
              mode: "normal",
              style: "",
            },
          ],
        },
        {
          type: "image",
          version: 1,
          src: "https://example.com/asset.png",
          alt: "Original alt",
          caption: "Original caption",
          alignment: "center",
          assetId: "asset-001",
          mimeType: "image/png",
        },
        {
          type: "iframe-embed",
          version: 1,
          src: "https://example.com/embed/widget",
          width: 720,
          height: 405,
          alignment: "left",
          title: "Widget",
          caption: "Widget caption",
          provider: "internal",
        },
        {
          type: "featureCard",
          version: 1,
          payload: {
            title: "AI Draft",
            score: 0.98,
          },
        },
      ],
    },
  } as JsonDocument;
}

describe("cross-format save round-trips", () => {
  it("keeps metadata-heavy content stable across JSON -> Markdown -> HTML chains", () => {
    const input = createCrossFormatFixture();

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("luthor:meta v1");
    const fromMarkdown = markdownToJSON(markdown) as JsonDocument;

    const html = jsonToHTML(fromMarkdown);
    expect(html).toContain("luthor:meta v1");
    const roundTrip = htmlToJSON(html) as JsonDocument;

    const textNode = (
      findTopLevelNode(roundTrip, "paragraph") as { children?: Array<{ format?: number }> }
    ).children?.[0];
    expect((Number(textNode?.format) & IS_BOLD) === IS_BOLD).toBe(true);
    expect((Number(textNode?.format) & IS_SUBSCRIPT) === IS_SUBSCRIPT).toBe(true);

    const imageNode = findTopLevelNode(roundTrip, "image") as {
      assetId?: string;
      mimeType?: string;
    };
    expect(imageNode.assetId).toBe("asset-001");
    expect(imageNode.mimeType).toBe("image/png");

    const iframeNode = findTopLevelNode(roundTrip, "iframe-embed") as {
      width?: number;
      height?: number;
      title?: string;
      provider?: string;
    };
    expect(iframeNode.width).toBe(720);
    expect(iframeNode.height).toBe(405);
    expect(iframeNode.title).toBe("Widget");
    expect(iframeNode.provider).toBe("internal");

    const featureCard = findTopLevelNode(roundTrip, "featureCard") as {
      payload?: { title?: string; score?: number };
    };
    expect(featureCard.payload).toEqual({ title: "AI Draft", score: 0.98 });
  });

  it("preserves non-native metadata after markdown-native edits", () => {
    const input = createCrossFormatFixture();
    const markdown = jsonToMarkdown(input);
    const editedMarkdown = markdown
      .replace("![Original alt]", "![Updated alt]")
      .replace("\"Widget caption\"", "\"Updated widget caption\"");

    const fromMarkdown = markdownToJSON(editedMarkdown) as JsonDocument;
    const html = jsonToHTML(fromMarkdown);
    const roundTrip = htmlToJSON(html) as JsonDocument;

    const imageNode = findTopLevelNode(roundTrip, "image") as {
      alt?: string;
      assetId?: string;
      mimeType?: string;
    };
    expect(imageNode.alt).toBe("Updated alt");
    expect(imageNode.assetId).toBe("asset-001");
    expect(imageNode.mimeType).toBe("image/png");

    const iframeNode = findTopLevelNode(roundTrip, "iframe-embed") as {
      caption?: string;
      provider?: string;
      width?: number;
      height?: number;
    };
    expect(iframeNode.caption).toBe("Updated widget caption");
    expect(iframeNode.provider).toBe("internal");
    expect(iframeNode.width).toBe(720);
    expect(iframeNode.height).toBe(405);
  });

  it("keeps linked-image attrs metadata-free across markdown/html chains", () => {
    const input = {
      root: {
        type: "root",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "image",
            version: 1,
            src: "https://example.com/badge.svg",
            alt: "Build",
            caption: "Build badge",
            alignment: "center",
            linkHref: "https://example.com/docs",
            linkTitle: "Docs",
          },
        ],
      },
    } satisfies JsonDocument;

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("[![Build](https://example.com/badge.svg \"Build badge\")](https://example.com/docs \"Docs\")");
    expect(markdown).not.toContain("luthor:meta v1");

    const fromMarkdown = markdownToJSON(markdown) as JsonDocument;
    const html = jsonToHTML(fromMarkdown);
    expect(html).not.toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    const imageNode = findTopLevelNode(roundTrip, "image") as {
      src?: string;
      linkHref?: string;
      linkTitle?: string;
      caption?: string;
    };

    expect(String(imageNode.src ?? "")).toContain("https://example.com/badge.svg");
    expect(String(imageNode.linkHref ?? "")).toContain("https://example.com/docs");
    expect(imageNode.linkTitle).toBe("Docs");
    expect(imageNode.caption).toBe("Build badge");
  });

  it("keeps canonical README fixture metadata-free across JSON/MD/HTML chains", () => {
    const fromMarkdown = markdownToJSON(README_CANONICAL_FIXTURE, {
      metadataMode: "none",
    }) as JsonDocument;

    const markdown = jsonToMarkdown(fromMarkdown);
    expect(markdown).toContain("luthor:meta v1");

    const markdownWithoutMetadata = jsonToMarkdown(fromMarkdown, {
      metadataMode: "none",
    });
    expect(markdownWithoutMetadata).not.toContain("luthor:meta v1");

    const html = jsonToHTML(fromMarkdown);
    expect(html).not.toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    expect(findTopLevelNode(roundTrip, "table")).toBeDefined();
    expect(findTopLevelNode(roundTrip, "heading")).toBeDefined();
    expect(findTopLevelNode(roundTrip, "image")).toBeDefined();
  });
});
