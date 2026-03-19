import { describe, expect, it } from "vitest";
import { IS_BOLD, IS_SUBSCRIPT } from "lexical";
import { jsonToMarkdown, markdownToJSON } from "./markdown";

type JsonDocument = {
  root: {
    children: Array<Record<string, unknown>>;
  };
};

function createSimpleDocument(text: string): Record<string, unknown> {
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
              text,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
            },
          ],
        },
      ],
    },
  };
}

function getFirstText(document: JsonDocument): string {
  const paragraph = document.root.children[0] as {
    children?: Array<{ text?: string }>;
  };
  return paragraph.children?.[0]?.text ?? "";
}

function findTopLevelNode(
  document: JsonDocument,
  type: string,
  index = 0,
): Record<string, unknown> | undefined {
  return document.root.children.filter((node) => node.type === type)[index];
}

function collectTextNodes(node: Record<string, unknown>): string[] {
  const values: string[] = [];

  if (node.type === "text" && typeof node.text === "string") {
    values.push(node.text);
  }

  if (!Array.isArray(node.children)) {
    return values;
  }

  for (const child of node.children) {
    if (typeof child === "object" && child !== null && !Array.isArray(child)) {
      values.push(...collectTextNodes(child as Record<string, unknown>));
    }
  }

  return values;
}

describe("markdown bridge", () => {
  it("keeps simple markdown/json conversion stable", () => {
    const markdown = jsonToMarkdown(createSimpleDocument("Hello Markdown"));
    expect(markdown).toContain("Hello Markdown");

    const roundTrip = markdownToJSON(markdown) as JsonDocument;
    expect(getFirstText(roundTrip)).toBe("Hello Markdown");
  });

  it("preserves unsupported nodes via metadata envelopes", () => {
    const input = {
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
                text: "Before",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
              },
            ],
          },
          {
            type: "featureCard",
            version: 1,
            payload: { title: "AI Draft" },
          },
        ],
      },
    };

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("luthor:meta v1");

    const roundTrip = markdownToJSON(markdown) as JsonDocument;
    const restoredNode = roundTrip.root.children[1] as {
      type?: string;
      payload?: Record<string, unknown>;
    };
    expect(restoredNode.type).toBe("featureCard");
    expect(restoredNode.payload).toEqual({ title: "AI Draft" });
  });

  it("skips metadata envelopes when metadataMode is none", () => {
    const input = {
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
                text: "Before",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
              },
            ],
          },
          {
            type: "featureCard",
            version: 1,
            payload: { title: "AI Draft" },
          },
        ],
      },
    };

    const markdown = jsonToMarkdown(input, { metadataMode: "none" });
    expect(markdown).not.toContain("luthor:meta v1");
    expect(markdown).toContain("[Unsupported featureCard preserved in markdown metadata]");

    const roundTrip = markdownToJSON(markdown, { metadataMode: "none" }) as JsonDocument;
    const secondNode = roundTrip.root.children[1] as {
      type?: string;
      children?: Array<{ text?: string }>;
    };
    expect(secondNode.type).not.toBe("featureCard");
    expect(secondNode.children?.[0]?.text ?? "").toContain("Unsupported featureCard");
  });

  it("ignores malformed metadata comments without failing import", () => {
    const markdown = "Hello\n\n<!-- luthor:meta v1 {bad-json} -->";
    const document = markdownToJSON(markdown) as JsonDocument;
    expect(getFirstText(document)).toBe("Hello");
  });

  it("round-trips horizontal rules natively without metadata envelopes", () => {
    const input = {
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
                text: "Before",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
              },
            ],
          },
          {
            type: "horizontalrule",
            version: 1,
          },
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
                text: "After",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
              },
            ],
          },
        ],
      },
    };

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("---");
    expect(markdown).not.toContain("luthor:meta v1");

    const roundTrip = markdownToJSON(markdown) as JsonDocument;
    const horizontalRule = findTopLevelNode(roundTrip, "horizontalrule");
    expect(horizontalRule).toBeDefined();
  });

  it("round-trips markdown tables natively", () => {
    const markdown = [
      "| Name | Role |",
      "| --- | --- |",
      "| Ada | Engineer |",
      "| Lin | Designer |",
    ].join("\n");

    const parsed = markdownToJSON(markdown) as JsonDocument;
    const tableNode = findTopLevelNode(parsed, "table");
    expect(tableNode).toBeDefined();

    const exported = jsonToMarkdown(parsed as unknown);
    expect(exported).toContain("| Name | Role |");
    expect(exported).toContain("| Ada | Engineer |");
    expect(exported).not.toContain("luthor:meta v1");
  });

  it("uses external emoji dataset for shortcode conversion in metadata-free mode", () => {
    const globalRecord = globalThis as Record<string, unknown>;
    const previousEmojiMartData = globalRecord.__EMOJI_MART_DATA__;
    const previousEmojiMart = globalRecord.EmojiMart;

    globalRecord.__EMOJI_MART_DATA__ = {
      emojis: {
        rocket: {
          shortcodes: ["rocket"],
          skins: [{ native: "\u{1F6F8}" }],
        },
      },
    };
    delete globalRecord.EmojiMart;

    try {
      const parsed = markdownToJSON("## :rocket: Launch", {
        metadataMode: "none",
      }) as JsonDocument;
      const heading = findTopLevelNode(parsed, "heading");
      expect(heading).toBeDefined();
      const headingText = collectTextNodes(heading as Record<string, unknown>).join("");
      expect(headingText).toContain("\u{1F6F8} Launch");
      expect(headingText).not.toContain(":rocket:");
    } finally {
      if (previousEmojiMartData === undefined) {
        delete globalRecord.__EMOJI_MART_DATA__;
      } else {
        globalRecord.__EMOJI_MART_DATA__ = previousEmojiMartData;
      }

      if (previousEmojiMart === undefined) {
        delete globalRecord.EmojiMart;
      } else {
        globalRecord.EmojiMart = previousEmojiMart;
      }
    }
  });

  it("imports README-style html wrappers, image badges, alignment, and emoji shortcodes in metadata-free mode", () => {
    const globalRecord = globalThis as Record<string, unknown>;
    const previousEmojiMartData = globalRecord.__EMOJI_MART_DATA__;
    const previousEmojiMart = globalRecord.EmojiMart;

    globalRecord.__EMOJI_MART_DATA__ = {
      emojis: {
        rocket: {
          shortcodes: ["rocket"],
          skins: [{ native: "\u{1F680}" }],
        },
        jigsaw: {
          shortcodes: ["jigsaw"],
          skins: [{ native: "\u{1F9E9}" }],
        },
      },
    };
    delete globalRecord.EmojiMart;

    const markdown = [
      "<div align=\"center\">",
      "  <picture>",
      "    <source media=\"(prefers-color-scheme: dark)\" srcset=\"dark.png\" />",
      "    <img src=\"light.png\" alt=\"Luthor\" width=\"420\" />",
      "  </picture>",
      "  <p><strong>TypeScript-first rich text editor ecosystem.</strong></p>",
      "  <p>:rocket: Production-ready presets + :jigsaw: extension runtime.</p>",
      "</div>",
      "",
      "<div align=\"center\">",
      "[![Project Status](https://img.shields.io/badge/status-stable)](https://github.com/lyfie-org/luthor)",
      "</div>",
      "",
      "<p align=\"center\">",
      "  <img src=\"preview.png\" alt=\"Preview\" width=\"960\" />",
      "</p>",
      "",
      "## :rocket: Quick Start",
      "",
      "| Feature | Value |",
      "| --- | --- |",
      "| table | works |",
    ].join("\n");

    try {
      const parsed = markdownToJSON(markdown, { metadataMode: "none" }) as JsonDocument;
      const allText = parsed.root.children.flatMap((node) => collectTextNodes(node));

      expect(allText.some((value) => value.includes("<div"))).toBe(false);
      expect(allText.some((value) => value.includes("<picture"))).toBe(false);
      expect(allText.some((value) => value.includes(":rocket:"))).toBe(false);
      expect(allText.some((value) => value.includes("\u{1F680}"))).toBe(true);
      expect(allText.some((value) => value.includes("\u{1F9E9}"))).toBe(true);

      const heading = findTopLevelNode(parsed, "heading");
      expect(heading).toBeDefined();
      expect(collectTextNodes(heading as Record<string, unknown>).join("")).toContain("\u{1F680} Quick Start");

      const imageNodes = parsed.root.children.filter((node) => node.type === "image");
      expect(imageNodes.length).toBeGreaterThanOrEqual(3);
      expect(
        imageNodes.some((node) => node.alignment === "center"),
      ).toBe(true);

      const centeredParagraph = parsed.root.children.find(
        (node) => node.type === "paragraph" && node.format === "center",
      );
      expect(centeredParagraph).toBeDefined();

      const tableNode = findTopLevelNode(parsed, "table");
      expect(tableNode).toBeDefined();
    } finally {
      if (previousEmojiMartData === undefined) {
        delete globalRecord.__EMOJI_MART_DATA__;
      } else {
        globalRecord.__EMOJI_MART_DATA__ = previousEmojiMartData;
      }

      if (previousEmojiMart === undefined) {
        delete globalRecord.EmojiMart;
      } else {
        globalRecord.EmojiMart = previousEmojiMart;
      }
    }
  });

  it("round-trips image nodes natively without metadata envelopes", () => {
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
            src: "https://example.com/photo.jpg",
            alt: "Example",
            alignment: "center",
            caption: "Demo caption",
          },
        ],
      },
    };

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("![Example](https://example.com/photo.jpg");
    expect(markdown).not.toContain("luthor:meta v1");

    const roundTrip = markdownToJSON(markdown) as JsonDocument;
    const imageNode = findTopLevelNode(roundTrip, "image") as {
      src?: string;
      alt?: string;
      caption?: string;
    };

    expect(imageNode).toBeDefined();
    expect(String(imageNode.src ?? "")).toContain("https://example.com/photo.jpg");
    expect(imageNode.alt).toBe("Example");
    expect(imageNode.caption).toBe("Demo caption");
  });

  it("round-trips iframe embed nodes with native markdown + metadata merge", () => {
    const input = {
      root: {
        type: "root",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "iframe-embed",
            version: 1,
            src: "https://example.com/embed/widget",
            width: 720,
            height: 405,
            alignment: "left",
            title: "Widget",
            caption: "External widget",
          },
        ],
      },
    };

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("[iframe](https://example.com/embed/widget \"External widget\")");
    expect(markdown).toContain("luthor:meta v1");
    expect(markdown).not.toContain("luthor:iframe");

    const editedMarkdown = markdown
      .replace("https://example.com/embed/widget", "https://example.com/embed/updated")
      .replace("\"External widget\"", "\"Updated iframe\"");

    const roundTrip = markdownToJSON(editedMarkdown) as JsonDocument;
    const iframeNode = findTopLevelNode(roundTrip, "iframe-embed") as {
      src?: string;
      width?: number;
      height?: number;
      alignment?: string;
      title?: string;
      caption?: string;
    };

    expect(iframeNode).toBeDefined();
    expect(String(iframeNode.src ?? "")).toContain("https://example.com/embed/updated");
    expect(iframeNode.caption).toBe("Updated iframe");
    expect(iframeNode.width).toBe(720);
    expect(iframeNode.height).toBe(405);
    expect(iframeNode.alignment).toBe("left");
    expect(iframeNode.title).toBe("Widget");
  });

  it("round-trips youtube embed nodes with native markdown + metadata merge", () => {
    const input = {
      root: {
        type: "root",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "youtube-embed",
            version: 1,
            src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            width: 800,
            height: 450,
            alignment: "right",
            caption: "Video caption",
            start: 12,
          },
        ],
      },
    };

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("[youtube](https://www.youtube.com/embed/dQw4w9WgXcQ \"Video caption\")");
    expect(markdown).toContain("luthor:meta v1");
    expect(markdown).not.toContain("luthor:youtube");

    const editedMarkdown = markdown
      .replace(
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/5NV6Rdv1a3I",
      )
      .replace("\"Video caption\"", "\"Updated YouTube\"");

    const roundTrip = markdownToJSON(editedMarkdown) as JsonDocument;
    const youtubeNode = findTopLevelNode(roundTrip, "youtube-embed") as {
      src?: string;
      width?: number;
      height?: number;
      alignment?: string;
      caption?: string;
      start?: number;
    };

    expect(youtubeNode).toBeDefined();
    expect(String(youtubeNode.src ?? "")).toContain("youtube.com/embed/5NV6Rdv1a3I");
    expect(youtubeNode.width).toBe(800);
    expect(youtubeNode.height).toBe(450);
    expect(youtubeNode.alignment).toBe("right");
    expect(youtubeNode.caption).toBe("Updated YouTube");
    expect(youtubeNode.start).toBe(12);
  });

  it("imports legacy iframe inline metadata comments for backward compatibility", () => {
    const markdown = [
      "[iframe](https://example.com/embed/legacy \"Legacy caption\")",
      "<!-- luthor:iframe {\"width\":700,\"height\":390,\"alignment\":\"right\",\"title\":\"Legacy title\"} -->",
    ].join(" ");

    const parsed = markdownToJSON(markdown) as JsonDocument;
    const iframeNode = findTopLevelNode(parsed, "iframe-embed") as {
      src?: string;
      width?: number;
      height?: number;
      alignment?: string;
      title?: string;
      caption?: string;
    };

    expect(iframeNode).toBeDefined();
    expect(String(iframeNode.src ?? "")).toContain("https://example.com/embed/legacy");
    expect(iframeNode.caption).toBe("Legacy caption");
    expect(iframeNode.width).toBe(700);
    expect(iframeNode.height).toBe(390);
    expect(iframeNode.alignment).toBe("right");
    expect(iframeNode.title).toBe("Legacy title");
  });

  it("imports legacy youtube inline metadata comments for backward compatibility", () => {
    const markdown = [
      "[youtube](https://www.youtube.com/embed/dQw4w9WgXcQ \"Legacy video\")",
      "<!-- luthor:youtube {\"width\":760,\"height\":428,\"alignment\":\"left\",\"start\":45} -->",
    ].join(" ");

    const parsed = markdownToJSON(markdown) as JsonDocument;
    const youtubeNode = findTopLevelNode(parsed, "youtube-embed") as {
      src?: string;
      width?: number;
      height?: number;
      alignment?: string;
      caption?: string;
      start?: number;
    };

    expect(youtubeNode).toBeDefined();
    expect(String(youtubeNode.src ?? "")).toContain("youtube.com/embed/dQw4w9WgXcQ");
    expect(youtubeNode.caption).toBe("Legacy video");
    expect(youtubeNode.width).toBe(760);
    expect(youtubeNode.height).toBe(428);
    expect(youtubeNode.alignment).toBe("left");
    expect(youtubeNode.start).toBe(45);
  });

  it("preserves non-native image metadata while keeping markdown-editable fields native", () => {
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
            src: "https://example.com/photo.jpg",
            alt: "Example",
            alignment: "center",
            caption: "Demo caption",
            width: 720,
            height: 405,
            className: "hero-image",
            style: { borderRadius: "12px" },
            uploading: true,
          },
        ],
      },
    };

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("![Example](https://example.com/photo.jpg");
    expect(markdown).toContain("luthor:meta v1");

    const editedMarkdown = markdown.replace("![Example]", "![Updated]");
    const roundTrip = markdownToJSON(editedMarkdown) as JsonDocument;
    const imageNode = findTopLevelNode(roundTrip, "image") as {
      src?: string;
      alt?: string;
      width?: number;
      height?: number;
      className?: string;
      style?: Record<string, unknown>;
      uploading?: boolean;
    };

    expect(imageNode).toBeDefined();
    expect(String(imageNode.src ?? "")).toContain("https://example.com/photo.jpg");
    expect(imageNode.alt).toBe("Updated");
    expect(imageNode.width).toBe(720);
    expect(imageNode.height).toBe(405);
    expect(imageNode.className).toBe("hero-image");
    expect(imageNode.style).toMatchObject({ borderRadius: "12px" });
    expect(imageNode.uploading).toBe(true);
  });

  it("preserves unsupported text format bits and style while keeping markdown text editable", () => {
    const input = {
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
                text: "Hello",
                detail: 0,
                format: IS_BOLD | IS_SUBSCRIPT,
                mode: "normal",
                style: "color: red;",
              },
            ],
          },
        ],
      },
    };

    const markdown = jsonToMarkdown(input);
    expect(markdown).toContain("Hello");
    expect(markdown).toContain("luthor:meta v1");

    const editedMarkdown = markdown.replace("Hello", "World");
    const roundTrip = markdownToJSON(editedMarkdown) as JsonDocument;
    const paragraph = findTopLevelNode(roundTrip, "paragraph") as {
      children?: Array<{ text?: string; format?: number; style?: string }>;
    };
    const textNode = paragraph.children?.[0] as {
      text?: string;
      format?: number;
      style?: string;
    };

    expect(textNode.text).toBe("World");
    expect((Number(textNode.format) & IS_BOLD) === IS_BOLD).toBe(true);
    expect((Number(textNode.format) & IS_SUBSCRIPT) === IS_SUBSCRIPT).toBe(true);
    expect(textNode.style).toBe("color: red;");
  });
});
