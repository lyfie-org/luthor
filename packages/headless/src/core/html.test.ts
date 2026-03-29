/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { htmlToJSON, jsonToHTML } from "./html";

type JsonNode = Record<string, unknown>;

type JsonDocument = {
  root: {
    children: JsonNode[];
    [key: string]: unknown;
  };
};

function textNode(text: string, format = 0): JsonNode {
  return {
    type: "text",
    version: 1,
    text,
    detail: 0,
    format,
    mode: "normal",
    style: "",
  };
}

function paragraphNode(children: JsonNode[]): JsonNode {
  return {
    type: "paragraph",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children,
  };
}

function createDocument(children: JsonNode[]): JsonDocument {
  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: null,
      children,
    },
  };
}

function getChildren(node: JsonNode): JsonNode[] {
  return Array.isArray(node.children) ? (node.children as JsonNode[]) : [];
}

function collectNodeText(node: JsonNode): string {
  const type = typeof node.type === "string" ? node.type : "";
  if (type === "text") {
    return typeof node.text === "string" ? node.text : "";
  }

  if (type === "linebreak") {
    return "\n";
  }

  if (type === "tab") {
    return "\t";
  }

  return getChildren(node).map((child) => collectNodeText(child)).join("");
}

function findTopLevelNode(
  document: JsonDocument,
  type: string,
  index = 0,
): JsonNode | undefined {
  return document.root.children.filter((node) => node.type === type)[index];
}

function findNestedNode(node: JsonNode, type: string): JsonNode | null {
  if (node.type === type) {
    return node;
  }

  for (const child of getChildren(node)) {
    const nested = findNestedNode(child, type);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function countNodesByType(node: JsonNode, type: string): number {
  let count = node.type === type ? 1 : 0;

  for (const child of getChildren(node)) {
    count += countNodesByType(child, type);
  }

  return count;
}

function roundTripJSON(input: JsonDocument): JsonDocument {
  return htmlToJSON(jsonToHTML(input)) as JsonDocument;
}

describe("html bridge", () => {
  it("converts between HTML and JSON for basic content", () => {
    const json = htmlToJSON("<p>Hello HTML</p>") as JsonDocument;
    const paragraph = findTopLevelNode(json, "paragraph");
    expect(paragraph).toBeDefined();
    expect(collectNodeText(paragraph as JsonNode)).toBe("Hello HTML");

    const html = jsonToHTML(json);
    expect(html).toContain("Hello HTML");
  });

  it("preserves unsupported nodes via metadata envelopes", () => {
    const input = createDocument([
      paragraphNode([textNode("Before")]),
      {
        type: "featureCard",
        version: 1,
        payload: { title: "AI Draft" },
      },
    ]);

    const html = jsonToHTML(input);
    expect(html).toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    const restoredNode = roundTrip.root.children[1] as {
      type?: string;
      payload?: Record<string, unknown>;
    };
    expect(restoredNode.type).toBe("featureCard");
    expect(restoredNode.payload).toEqual({ title: "AI Draft" });
  });

  it("skips metadata envelopes when metadataMode is none", () => {
    const input = createDocument([
      paragraphNode([textNode("Before")]),
      {
        type: "featureCard",
        version: 1,
        payload: { title: "AI Draft" },
      },
    ]);

    const html = jsonToHTML(input, { metadataMode: "none" });
    expect(html).not.toContain("luthor:meta v1");
    expect(html).toContain("[Unsupported featureCard preserved in html metadata]");

    const roundTrip = htmlToJSON(html, { metadataMode: "none" }) as JsonDocument;
    const secondNode = roundTrip.root.children[1] as {
      type?: string;
      children?: JsonNode[];
    };
    expect(secondNode.type).not.toBe("featureCard");
    expect(collectNodeText(secondNode as JsonNode)).toContain("Unsupported featureCard");
  });

  it("normalizes align attributes and picture tags into native lexical structures", () => {
    const html = [
      "<div align=\"center\">",
      "  <p>Centered line</p>",
      "  <picture>",
      "    <source media=\"(prefers-color-scheme: dark)\" srcset=\"dark.png\" />",
      "    <img src=\"light.png\" alt=\"Logo\" width=\"420\" />",
      "  </picture>",
      "</div>",
      "<p align=\"center\">",
      "  <img src=\"preview.png\" alt=\"Preview\" width=\"960\" />",
      "</p>",
    ].join("\n");

    const parsed = htmlToJSON(html, { metadataMode: "none" }) as JsonDocument;
    const centeredParagraph = parsed.root.children.find(
      (node) => node.type === "paragraph" && node.format === "center",
    );
    expect(centeredParagraph).toBeDefined();
    expect(collectNodeText(centeredParagraph as JsonNode)).toContain("Centered line");

    const nestedImages = parsed.root.children
      .map((node) => findNestedNode(node, "image"))
      .filter((node): node is JsonNode => node !== null);
    expect(nestedImages.length).toBeGreaterThanOrEqual(2);
    expect(
      nestedImages.some((node) => typeof node.src === "string" && node.src.endsWith("/light.png")),
    ).toBe(true);
    expect(
      nestedImages.some((node) => typeof node.src === "string" && node.src.endsWith("/preview.png")),
    ).toBe(true);
  });

  it("normalizes indentation-heavy pre-wrap html without creating formatter artifacts", () => {
    const formattedHtml = [
      "<p>",
      "  <b>",
      "    <strong style=\"white-space: pre-wrap;\">",
      "      Hello ",
      "    </strong>",
      "  </b>",
      "  <span style=\"white-space: pre-wrap;\">world</span>",
      "  <span style=\"white-space: pre-wrap;\"> and </span>",
      "  <i>",
      "    <em style=\"white-space: pre-wrap;\">friends</em>",
      "  </i>",
      "  <span style=\"white-space: pre-wrap;\">.</span>",
      "</p>",
    ].join("\n");

    const parsed = htmlToJSON(formattedHtml) as JsonDocument;
    const paragraph = findTopLevelNode(parsed, "paragraph");
    expect(paragraph).toBeDefined();
    expect(collectNodeText(paragraph as JsonNode)).toBe("Hello world and friends.");
  });

  it("round-trips heading nodes", () => {
    const input = createDocument([
      {
        type: "heading",
        version: 1,
        tag: "h2",
        format: "",
        indent: 0,
        direction: null,
        children: [textNode("Section heading")],
      },
    ]);

    const roundTrip = roundTripJSON(input);
    const heading = findTopLevelNode(roundTrip, "heading");
    expect(heading).toBeDefined();
    expect(heading?.tag).toBe("h2");
    expect(collectNodeText(heading as JsonNode)).toBe("Section heading");
  });

  it("round-trips quote nodes", () => {
    const input = createDocument([
      {
        type: "quote",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [textNode("Quoted line")],
      },
    ]);

    const roundTrip = roundTripJSON(input);
    const quote = findTopLevelNode(roundTrip, "quote");
    expect(quote).toBeDefined();
    expect(collectNodeText(quote as JsonNode)).toBe("Quoted line");
  });

  it("round-trips list and listitem nodes", () => {
    const input = createDocument([
      {
        type: "list",
        version: 1,
        listType: "bullet",
        start: 1,
        tag: "ul",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "listitem",
            version: 1,
            value: 1,
            checked: null,
            format: "",
            indent: 0,
            direction: null,
            children: [textNode("First item")],
          },
          {
            type: "listitem",
            version: 1,
            value: 2,
            checked: null,
            format: "",
            indent: 0,
            direction: null,
            children: [textNode("Second item")],
          },
        ],
      },
    ]);

    const roundTrip = roundTripJSON(input);
    const list = findTopLevelNode(roundTrip, "list");
    expect(list).toBeDefined();
    expect(list?.listType).toBe("bullet");
    const listItems = getChildren(list as JsonNode);
    expect(listItems).toHaveLength(2);
    expect(collectNodeText(listItems[0])).toBe("First item");
    expect(collectNodeText(listItems[1])).toBe("Second item");
  });

  it("round-trips nested lists without metadata comments in metadata-free mode", () => {
    const input = createDocument([
      {
        type: "list",
        version: 1,
        listType: "bullet",
        start: 1,
        tag: "ul",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "listitem",
            version: 1,
            value: 1,
            checked: null,
            format: "",
            indent: 0,
            direction: null,
            children: [
              textNode("Parent item"),
              {
                type: "list",
                version: 1,
                listType: "bullet",
                start: 1,
                tag: "ul",
                format: "",
                indent: 0,
                direction: null,
                children: [
                  {
                    type: "listitem",
                    version: 1,
                    value: 1,
                    checked: null,
                    format: "",
                    indent: 0,
                    direction: null,
                    children: [textNode("Child item")],
                  },
                ],
              },
            ],
          },
          {
            type: "listitem",
            version: 1,
            value: 2,
            checked: null,
            format: "",
            indent: 0,
            direction: null,
            children: [textNode("Sibling item")],
          },
        ],
      },
    ]);

    const html = jsonToHTML(input, { metadataMode: "none" });
    expect(html).not.toContain("luthor:meta v1");
    expect((html.match(/<ul\b/gi) ?? []).length).toBeGreaterThanOrEqual(2);

    const roundTrip = htmlToJSON(html, { metadataMode: "none" }) as JsonDocument;
    const list = findTopLevelNode(roundTrip, "list");
    expect(list).toBeDefined();
    expect(countNodesByType(list as JsonNode, "list")).toBeGreaterThanOrEqual(2);
    expect(collectNodeText(list as JsonNode)).toContain("Parent item");
    expect(collectNodeText(list as JsonNode)).toContain("Child item");
    expect(collectNodeText(list as JsonNode)).toContain("Sibling item");
  });

  it("round-trips default ordered and checklist structures without metadata comments", () => {
    const input = createDocument([
      {
        type: "list",
        version: 1,
        listType: "number",
        start: 1,
        tag: "ol",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "listitem",
            version: 1,
            value: 1,
            checked: null,
            format: "",
            indent: 0,
            direction: null,
            children: [
              textNode("Ordered parent"),
              {
                type: "list",
                version: 1,
                listType: "number",
                start: 1,
                tag: "ol",
                format: "",
                indent: 0,
                direction: null,
                children: [
                  {
                    type: "listitem",
                    version: 1,
                    value: 1,
                    checked: null,
                    format: "",
                    indent: 0,
                    direction: null,
                    children: [textNode("Ordered child")],
                  },
                ],
              },
            ],
          },
          {
            type: "listitem",
            version: 1,
            value: 2,
            checked: null,
            format: "",
            indent: 0,
            direction: null,
            children: [textNode("Ordered sibling")],
          },
        ],
      },
      {
        type: "list",
        version: 1,
        listType: "check",
        start: 1,
        tag: "ul",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "listitem",
            version: 1,
            value: 1,
            checked: false,
            format: "",
            indent: 0,
            direction: null,
            children: [textNode("Task parent")],
          },
          {
            type: "listitem",
            version: 1,
            value: 2,
            checked: true,
            format: "",
            indent: 0,
            direction: null,
            children: [textNode("Task child")],
          },
        ],
      },
    ]);

    const html = jsonToHTML(input, { metadataMode: "none" });
    expect(html).not.toContain("luthor:meta v1");
    expect(html).toContain("<ol");
    expect(html).toContain("Ordered parent");
    expect(html).toContain("Ordered child");
    expect(html).toContain("Task parent");
    expect(html).toContain("Task child");

    const roundTrip = htmlToJSON(html, { metadataMode: "none" }) as JsonDocument;
    const allText = roundTrip.root.children.map((node) => collectNodeText(node)).join("\n");
    expect(allText).toContain("Ordered parent");
    expect(allText).toContain("Ordered child");
    expect(allText).toContain("Ordered sibling");
    expect(allText).toContain("Task parent");
    expect(allText).toContain("Task child");
  });

  it("round-trips link nodes", () => {
    const input = createDocument([
      paragraphNode([
        textNode("Read "),
        {
          type: "link",
          version: 1,
          url: "https://example.com/docs",
          rel: "noreferrer",
          target: "_blank",
          title: null,
          children: [textNode("documentation")],
        },
        textNode(" now."),
      ]),
    ]);

    const roundTrip = roundTripJSON(input);
    const paragraph = findTopLevelNode(roundTrip, "paragraph");
    expect(paragraph).toBeDefined();
    const linkNode = findNestedNode(paragraph as JsonNode, "link");
    expect(linkNode).not.toBeNull();
    expect(String(linkNode?.url ?? "")).toContain("https://example.com/docs");
    expect(collectNodeText(linkNode as JsonNode)).toBe("documentation");
  });

  it("round-trips code nodes", () => {
    const input = createDocument([
      {
        type: "code",
        version: 1,
        language: "typescript",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "code-highlight",
            version: 1,
            text: "const value = 42;",
            highlightType: "text",
          },
        ],
      },
    ]);

    const roundTrip = roundTripJSON(input);
    const code = findTopLevelNode(roundTrip, "code");
    expect(code).toBeDefined();
    expect(code?.language).toBe("typescript");
    expect(collectNodeText(code as JsonNode)).toContain("const value = 42;");
  });

  it("round-trips horizontal rule nodes natively", () => {
    const input = createDocument([
      paragraphNode([textNode("Before")]),
      {
        type: "horizontalrule",
        version: 1,
      },
      paragraphNode([textNode("After")]),
    ]);

    const html = jsonToHTML(input);
    expect(html).toContain("<hr");
    expect(html).not.toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    const horizontalRule = findTopLevelNode(roundTrip, "horizontalrule");
    expect(horizontalRule).toBeDefined();
  });

  it("exports and re-imports image nodes natively", () => {
    const input = createDocument([
      {
        type: "image",
        version: 1,
        src: "https://example.com/photo.jpg",
        alt: "Example",
        alignment: "center",
      },
    ]);

    const html = jsonToHTML(input);
    expect(html).toContain("<img");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    const imageNode = roundTrip.root.children[0] as {
      type?: string;
      src?: string;
      alt?: string;
    };
    expect(imageNode.type).toBe("image");
    expect(imageNode.src).toContain("https://example.com/photo.jpg");
    expect(imageNode.alt).toBe("Example");
  });

  it("round-trips linked images natively without metadata envelopes", () => {
    const input = createDocument([
      {
        type: "image",
        version: 1,
        src: "https://example.com/badge.svg",
        alt: "Build",
        caption: "Build status",
        linkHref: "https://example.com/docs",
        linkTitle: "Docs",
        alignment: "center",
      },
    ]);

    const html = jsonToHTML(input);
    expect(html).toContain("<a");
    expect(html).toContain("https://example.com/docs");
    expect(html).not.toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    const imageNode = findTopLevelNode(roundTrip, "image") as {
      linkHref?: string;
      linkTitle?: string;
      caption?: string;
      src?: string;
    };
    expect(String(imageNode?.src ?? "")).toContain("https://example.com/badge.svg");
    expect(String(imageNode?.linkHref ?? "")).toContain("https://example.com/docs");
    expect(imageNode?.linkTitle).toBe("Docs");
    expect(imageNode?.caption).toBe("Build status");
  });

  it("preserves frontmatter in html mode via metadata envelopes", () => {
    const input = {
      root: {
        type: "root",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        frontmatter: "---\ntitle: Demo\n---",
        children: [paragraphNode([textNode("Body")])],
      },
    } satisfies JsonDocument & {
      root: {
        frontmatter: string;
      };
    };

    const html = jsonToHTML(input);
    expect(html).toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument & {
      root: {
        frontmatter?: string;
      };
    };
    expect(roundTrip.root.frontmatter).toContain("title: Demo");
  });

  it("round-trips iframe embed nodes", () => {
    const input = createDocument([
      {
        type: "iframe-embed",
        version: 1,
        src: "https://example.com/embed/widget",
        width: 640,
        height: 360,
        alignment: "center",
        title: "Widget",
        caption: "External widget",
      },
    ]);

    const html = jsonToHTML(input);
    expect(html).toContain("<iframe");
    expect(html).not.toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    const iframe = findTopLevelNode(roundTrip, "iframe-embed");
    expect(iframe).toBeDefined();
    expect(String(iframe?.src ?? "")).toContain("https://example.com/embed/widget");
    expect(iframe?.width).toBe(640);
    expect(iframe?.height).toBe(360);
    expect(iframe?.alignment).toBe("center");
    expect(iframe?.caption).toBe("External widget");
  });

  it("round-trips youtube embed nodes", () => {
    const input = createDocument([
      {
        type: "youtube-embed",
        version: 1,
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        width: 640,
        height: 360,
        alignment: "center",
        caption: "Video caption",
        start: 12,
      },
    ]);

    const html = jsonToHTML(input);
    expect(html).toContain("<iframe");
    expect(html).not.toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    const youtube = findTopLevelNode(roundTrip, "youtube-embed");
    expect(youtube).toBeDefined();
    expect(String(youtube?.src ?? "")).toContain("youtube.com/embed/dQw4w9WgXcQ");
    expect(youtube?.width).toBe(640);
    expect(youtube?.height).toBe(360);
    expect(youtube?.alignment).toBe("center");
    expect(youtube?.caption).toBe("Video caption");
  });

  it("round-trips table nodes natively", () => {
    const input = createDocument([
      {
        type: "table",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "tablerow",
            version: 1,
            children: [
              {
                type: "tablecell",
                version: 1,
                headerState: 1,
                colSpan: 1,
                rowSpan: 1,
                width: 120,
                backgroundColor: null,
                children: [paragraphNode([textNode("Name")])],
              },
              {
                type: "tablecell",
                version: 1,
                headerState: 1,
                colSpan: 1,
                rowSpan: 1,
                width: 160,
                backgroundColor: null,
                children: [paragraphNode([textNode("Role")])],
              },
            ],
          },
          {
            type: "tablerow",
            version: 1,
            children: [
              {
                type: "tablecell",
                version: 1,
                headerState: 0,
                colSpan: 1,
                rowSpan: 1,
                width: 120,
                backgroundColor: null,
                children: [paragraphNode([textNode("Ada")])],
              },
              {
                type: "tablecell",
                version: 1,
                headerState: 0,
                colSpan: 1,
                rowSpan: 1,
                width: 160,
                backgroundColor: null,
                children: [paragraphNode([textNode("Engineer")])],
              },
            ],
          },
        ],
      },
    ]);

    const html = jsonToHTML(input);
    expect(html).toContain("<table");
    expect(html).not.toContain("luthor:meta v1");

    const roundTrip = htmlToJSON(html) as JsonDocument;
    const tableNode = findTopLevelNode(roundTrip, "table");
    expect(tableNode).toBeDefined();

    const rows = getChildren(tableNode as JsonNode);
    expect(rows.length).toBe(2);
    const firstRowCells = getChildren(rows[0] as JsonNode);
    const secondRowCells = getChildren(rows[1] as JsonNode);
    expect(collectNodeText(firstRowCells[0] as JsonNode)).toContain("Name");
    expect(collectNodeText(firstRowCells[1] as JsonNode)).toContain("Role");
    expect(collectNodeText(secondRowCells[0] as JsonNode)).toContain("Ada");
    expect(collectNodeText(secondRowCells[1] as JsonNode)).toContain("Engineer");
  });

  it("round-trips mixed extensive-editor component documents collectively", () => {
    const input = createDocument([
      {
        type: "heading",
        version: 1,
        tag: "h1",
        format: "",
        indent: 0,
        direction: null,
        children: [textNode("Composite document")],
      },
      paragraphNode([
        textNode("Visit "),
        {
          type: "link",
          version: 1,
          url: "https://example.com",
          rel: null,
          target: null,
          title: null,
          children: [textNode("example.com")],
        },
        textNode(" for docs."),
      ]),
      {
        type: "list",
        version: 1,
        listType: "bullet",
        start: 1,
        tag: "ul",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "listitem",
            version: 1,
            value: 1,
            checked: null,
            format: "",
            indent: 0,
            direction: null,
            children: [textNode("Checklist item")],
          },
        ],
      },
      {
        type: "quote",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [textNode("Keep round-trips stable.")],
      },
      {
        type: "code",
        version: 1,
        language: "typescript",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "code-highlight",
            version: 1,
            text: "console.log('ok');",
            highlightType: "text",
          },
        ],
      },
      {
        type: "image",
        version: 1,
        src: "https://example.com/image.png",
        alt: "Diagram",
        alignment: "left",
      },
      {
        type: "iframe-embed",
        version: 1,
        src: "https://example.com/embed/panel",
        width: 640,
        height: 360,
        alignment: "center",
        title: "Panel",
        caption: "Panel caption",
      },
      {
        type: "youtube-embed",
        version: 1,
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        width: 640,
        height: 360,
        alignment: "right",
        caption: "Video caption",
        start: 5,
      },
    ]);

    const roundTrip = roundTripJSON(input);
    const types = roundTrip.root.children.map((node) => String(node.type));
    expect(types).toEqual([
      "heading",
      "paragraph",
      "list",
      "quote",
      "code",
      "image",
      "iframe-embed",
      "youtube-embed",
    ]);

    const heading = findTopLevelNode(roundTrip, "heading");
    const paragraph = findTopLevelNode(roundTrip, "paragraph");
    const list = findTopLevelNode(roundTrip, "list");
    const quote = findTopLevelNode(roundTrip, "quote");
    const code = findTopLevelNode(roundTrip, "code");
    const image = findTopLevelNode(roundTrip, "image");
    const iframe = findTopLevelNode(roundTrip, "iframe-embed");
    const youtube = findTopLevelNode(roundTrip, "youtube-embed");

    expect(collectNodeText(heading as JsonNode)).toBe("Composite document");
    expect(collectNodeText(paragraph as JsonNode)).toContain("Visit example.com for docs.");
    expect(collectNodeText(list as JsonNode)).toContain("Checklist item");
    expect(collectNodeText(quote as JsonNode)).toContain("Keep round-trips stable.");
    expect(collectNodeText(code as JsonNode)).toContain("console.log('ok');");
    expect(String(image?.src ?? "")).toContain("https://example.com/image.png");
    expect(String(iframe?.src ?? "")).toContain("https://example.com/embed/panel");
    expect(String(youtube?.src ?? "")).toContain("youtube.com/embed/dQw4w9WgXcQ");
  });
});
