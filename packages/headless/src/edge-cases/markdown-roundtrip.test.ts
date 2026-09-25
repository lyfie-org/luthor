/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { jsonToMarkdown, markdownToJSON, type JsonDocument } from "../core/markdown";
import {
  BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
  BlockAnchorNode,
} from "../extensions/embeds/BlockAnchorNode";

/*
 * Save → reopen must be lossless. A host that stores markdown (Papyra writes
 * `.md` files) re-imports the editor's own output on every open, so any shape
 * the exporter writes that the importer reads differently is corrupted a bit
 * more on every save. These cases pin the shapes that used to drift: empty
 * blocks, mixed-type nested lists, code whitespace, and anchors on blocks
 * whose text was deleted.
 */

const OPTIONS = {
  metadataMode: "none" as const,
  extraNodes: [BlockAnchorNode],
  extraTransformers: [BLOCK_ANCHOR_MARKDOWN_TRANSFORMER],
};

const toJSON = (markdown: string) => markdownToJSON(markdown, OPTIONS);
const roundTrip = (markdown: string) => jsonToMarkdown(toJSON(markdown), OPTIONS);

/** A compact structural outline of a document, for asserting shape. */
function outline(document: JsonDocument): string[] {
  const lines: string[] = [];
  const walk = (node: Record<string, unknown>, depth: number) => {
    let label: string;
    switch (node.type) {
      case "text":
        label = JSON.stringify(node.text);
        break;
      case "blockAnchor":
        label = `^${String(node.blockId)}`;
        break;
      case "list":
        label = `list:${String(node.listType)}`;
        break;
      case "listitem":
        label = typeof node.checked === "boolean" ? `item:${node.checked ? "x" : " "}` : "item";
        break;
      default:
        label = String(node.type);
    }
    lines.push("  ".repeat(depth) + label);
    for (const child of (node.children as Record<string, unknown>[] | undefined) ?? []) {
      walk(child, depth + 1);
    }
  };
  for (const child of (document.root as { children: Record<string, unknown>[] }).children) {
    walk(child, 0);
  }
  return lines;
}

/** Export must reproduce the input exactly, and stay fixed on re-save. */
function expectLossless(markdown: string) {
  const first = roundTrip(markdown);
  expect(first).toBe(markdown);
  expect(roundTrip(first)).toBe(first);
}

describe("markdown round-trip: empty blocks", () => {
  it("keeps an empty nested numbered item as its own item", () => {
    const markdown = "1. Whiskey ^w1\n    1. Yamazaki ^y1\n    2. Hibiki ^h1\n    3. ";
    expectLossless(markdown);
    expect(outline(toJSON(markdown))).toEqual([
      "list:number",
      "  item",
      '    "Whiskey"',
      "    ^w1",
      "  item",
      "    list:number",
      "      item",
      '        "Yamazaki"',
      "        ^y1",
      "      item",
      '        "Hibiki"',
      "        ^h1",
      "      item",
    ]);
  });

  it("reads a marker whose trailing space was trimmed as an empty item", () => {
    // Editors and git hooks strip trailing whitespace; `3.` must still be an
    // item, never text glued onto the item above behind a line break.
    const document = toJSON("1. A\n    1. B\n    2.\n2. C");
    expect(outline(document)).toEqual([
      "list:number",
      "  item",
      '    "A"',
      "  item",
      "    list:number",
      "      item",
      '        "B"',
      "      item",
      "  item",
      '    "C"',
    ]);
  });

  it("does not renumber or split a list around an empty item", () => {
    expectLossless("1. A\n2. \n3. C");
    expectLossless("- A\n- \n- C");
    expectLossless("- A\n    - \n- C");
  });

  it("keeps empty checklist items in the same checklist", () => {
    const markdown = "- [ ] A\n- [ ] \n- [x] C\n    - [ ] ";
    expectLossless(markdown);
    expect(outline(toJSON(markdown))).toEqual([
      "list:check",
      "  item: ",
      '    "A"',
      "  item: ",
      "  item:x",
      '    "C"',
      "  item: ",
      "    list:check",
      "      item: ",
    ]);
  });

  it("keeps a blank line inside a quote", () => {
    const markdown = "> line one\n> \n> line three";
    expectLossless(markdown);
    expect(outline(toJSON(markdown))).toEqual([
      "quote",
      '  "line one"',
      "  linebreak",
      "  linebreak",
      '  "line three"',
    ]);
  });

  it("keeps empty headings and quotes as blocks", () => {
    expectLossless("# \n\nafter");
    expectLossless("> \n\nafter");
    expect(outline(toJSON("#\n\nafter"))[0]).toBe("heading");
  });

  it("still treats #hashtag and --- as text and a rule", () => {
    expectLossless("#tag not a heading");
    expectLossless("para\n\n---\n\nafter");
  });
});

describe("markdown round-trip: nested lists of mixed types", () => {
  it("nests bullets and checklists under numbered items", () => {
    const markdown =
      "1. Trip\n    - passport\n    - tickets\n2. Food\n    - [ ] rice\n    - [x] tea\n3. Done";
    expectLossless(markdown);
    expect(outline(toJSON(markdown))).toEqual([
      "list:number",
      "  item",
      '    "Trip"',
      "  item",
      "    list:bullet",
      "      item",
      '        "passport"',
      "      item",
      '        "tickets"',
      "  item",
      '    "Food"',
      "  item",
      "    list:check",
      "      item: ",
      '        "rice"',
      "      item:x",
      '        "tea"',
      "  item",
      '    "Done"',
    ]);
  });

  it("places a same-type line correctly beneath a different-type level", () => {
    const markdown = "- x\n    1. y\n        - z\n    2. w\n- v";
    expectLossless(markdown);
    expect(outline(toJSON(markdown))).toEqual([
      "list:bullet",
      "  item",
      '    "x"',
      "  item",
      "    list:number",
      "      item",
      '        "y"',
      "      item",
      "        list:bullet",
      "          item",
      '            "z"',
      "      item",
      '        "w"',
      "  item",
      '    "v"',
    ]);
  });

  it("opens a new nested list when the type changes at the same depth", () => {
    expectLossless("1. A\n    - b\n    1. c");
  });

  it("keeps deep same-type nesting intact", () => {
    expectLossless("1. A\n    1. B\n        1. C\n    2. D\n2. E");
  });
});

describe("markdown round-trip: code blocks", () => {
  it("preserves trailing and whitespace-only lines inside a fence", () => {
    expectLossless("```js\nconst a = 1;  \n  \n\tb();\t\n```\n\nafter");
  });

  it("does not parse block markers inside a fence", () => {
    const markdown = "```\n1. \n- \n> \n# \n^abc1234\n```";
    expectLossless(markdown);
    expect(outline(toJSON(markdown))).toEqual(["code", '  "1. \\n- \\n> \\n# \\n^abc1234"']);
  });

  it("imports tilde fences as code blocks", () => {
    expect(roundTrip("~~~python\nx = 1  \n~~~\n\nafter")).toBe(
      "```python\nx = 1  \n```\n\nafter",
    );
    expectLossless("```\n~~~\nx\n~~~\n```");
  });

  it("leaves an unclosed tilde fence and pre-existing sentinel characters alone", () => {
    expect(outline(toJSON("~~~\nx"))[0]).toBe("paragraph");
    // Real private-use text is never rewritten: protection is skipped, so the
    // content survives and only the (unprotected) trailing space is trimmed.
    expect(roundTrip("```\na \n```")).toBe("```\na\n```");
  });
});

describe("markdown round-trip: block anchors", () => {
  it("keeps an anchor on an item whose text was deleted", () => {
    expectLossless("1. A ^a1\n2.  ^b1\n3. C ^c1");
  });

  it("reads a legacy `2. ^id` item as an anchored empty item, not text", () => {
    const document = toJSON("1. A ^a1\n    1. B\n    2. ^0b9vdhib");
    expect(outline(document).slice(-2)).toEqual(["      item", "        ^0b9vdhib"]);
    expect(jsonToMarkdown(document, OPTIONS)).toBe("1. A ^a1\n    1. B\n    2.  ^0b9vdhib");
  });

  it("does not treat ^id glued to inline formatting as an anchor", () => {
    expect(outline(toJSON("**bold**^abc12345"))).toEqual([
      "paragraph",
      '  "bold"',
      '  "^abc12345"',
    ]);
  });

  it("keeps anchors on every kind of block", () => {
    expectLossless(
      [
        "# Heading ^h1",
        "",
        "Para ^p1",
        "",
        "> quote ^q1",
        "",
        "1. one ^o1",
        "    - two ^b1",
        "        - [ ] three ^c1",
      ].join("\n"),
    );
  });
});

describe("markdown round-trip: tables", () => {
  it("keeps empty cells", () => {
    expectLossless("| a | b |\n| --- | --- |\n| 1 |  |\n|  | x |\n\nafter");
  });
});

describe("markdown round-trip: line endings", () => {
  it("reads CRLF files the same as LF", () => {
    expect(roundTrip("1. A\r\n    1. B\r\n    2. \r\n")).toBe("1. A\n    1. B\n    2. ");
  });
});
