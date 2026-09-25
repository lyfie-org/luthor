/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { htmlToJSON, jsonToHTML, jsonToMarkdown } from "@lyfie/luthor-headless";
import { formatHTMLSource, formatMarkdownSource } from "./source-format";

describe("formatMarkdownSource", () => {
  // The bridge writes canonical markdown; the source view must show exactly
  // that. Reformatting here dropped a note's leading/trailing blank lines and
  // rewrote escaped stars in plain text on every read.
  it("passes the bridge's markdown through, only normalising line breaks", () => {
    expect(formatMarkdownSource("\n\nBody\r\n\r\n\r\n")).toBe("\n\nBody\n\n\n");
    expect(formatMarkdownSource("a \\* b \\* c")).toBe("a \\* b \\* c");
  });

  it("gets tidy emphasis from the bridge itself: edge spaces sit outside markers", () => {
    const text = (value: string, format: number) => ({
      type: "text", version: 1, text: value, format, detail: 0, mode: "normal", style: "",
    });
    const doc = (...children: unknown[]) => ({
      root: { type: "root", version: 1, format: "", indent: 0, direction: null, children: [{
        type: "paragraph", version: 1, format: "", indent: 0, direction: null, children,
      }] },
    });
    expect(jsonToMarkdown(doc(text("This is a ", 0), text("bold ", 1), text("line", 0)), { metadataMode: "none" }))
      .toBe("This is a **bold** line");
    expect(jsonToMarkdown(doc(text("it ", 2), text("x ", 0), text("st ", 4), text("y", 0)), { metadataMode: "none" }))
      .toBe("*it* x ~~st~~ y");
  });
});

describe("formatHTMLSource", () => {
  it("normalizes line breaks and trims output", () => {
    expect(formatHTMLSource(" <p>Hello</p>\r\n\r\n")).toBe("<p>Hello</p>");
  });

  it("pretty prints compact html into multiple lines", () => {
    expect(formatHTMLSource("<div><p>Hello</p><p>World</p></div>")).toBe(
      "<div>\n  <p>Hello</p>\n  <p>World</p>\n</div>",
    );
  });

  it("preserves inline lexical spacing without injecting formatter artifacts", () => {
    expect(
      formatHTMLSource(
        "<p><span style=\"white-space: pre-wrap;\">Hello </span><span style=\"white-space: pre-wrap;\">world</span></p>",
      ),
    ).toBe(
      "<p><span style=\"white-space: pre-wrap;\">Hello </span><span style=\"white-space: pre-wrap;\">world</span></p>",
    );
  });

  it("formats nested block containers while keeping inline content intact", () => {
    expect(formatHTMLSource("<ul><li><span>A</span></li><li><span>B</span></li></ul>")).toBe(
      "<ul>\n  <li><span>A</span></li>\n  <li><span>B</span></li>\n</ul>",
    );
  });

  it("keeps html -> visual bridge text stable after html formatting", () => {
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
                text: "Hello ",
                detail: 0,
                format: 1,
                mode: "normal",
                style: "",
              },
              {
                type: "text",
                version: 1,
                text: "world",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
              },
              {
                type: "text",
                version: 1,
                text: " and ",
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
              },
              {
                type: "text",
                version: 1,
                text: "friends",
                detail: 0,
                format: 2,
                mode: "normal",
                style: "",
              },
              {
                type: "text",
                version: 1,
                text: ".",
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

    const formattedHtml = formatHTMLSource(jsonToHTML(input));
    const roundTrip = htmlToJSON(formattedHtml) as {
      root: { children?: Array<{ children?: Array<{ text?: string }> }> };
    };
    const text = roundTrip.root.children?.[0]?.children?.map((node) => node.text ?? "").join("") ?? "";

    expect(text).toBe("Hello world and friends.");
  });
});
