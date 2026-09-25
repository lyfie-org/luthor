/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { jsonToMarkdown, markdownToJSON } from "../core/markdown";
import {
  BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
  BlockAnchorNode,
} from "../extensions/embeds/BlockAnchorNode";

/*
 * Whatever a person types must come back exactly as typed after save → reopen,
 * and saving it again must not change the file. Each case builds the editor's
 * own JSON (what typing produces), exports it, re-imports it, and compares
 * structure and text; then checks the markdown is a fixed point.
 */

const OPTIONS = {
  metadataMode: "none" as const,
  extraNodes: [BlockAnchorNode],
  extraTransformers: [BLOCK_ANCHOR_MARKDOWN_TRANSFORMER],
};
const toJSON = (markdown: string) => markdownToJSON(markdown, OPTIONS);
const toMarkdown = (document: unknown) => jsonToMarkdown(document, OPTIONS);

type Node = Record<string, unknown>;

const text = (value: string, format = 0): Node => ({
  type: "text", version: 1, text: value, format, detail: 0, mode: "normal", style: "",
});
const br = (): Node => ({ type: "linebreak", version: 1 });
const block = (type: string, children: Node[], extra: Node = {}): Node => ({
  type, version: 1, format: "", indent: 0, direction: null, textFormat: 0, textStyle: "", children, ...extra,
});
const p = (...children: Node[]) => block("paragraph", children);
const h = (tag: string, ...children: Node[]) => block("heading", children, { tag });
const quote = (...children: Node[]) => block("quote", children);
const item = (value: number, ...children: Node[]) => block("listitem", children, { value });
const list = (listType: string, ...items: Node[]) =>
  block("list", items, { listType, start: 1, tag: listType === "number" ? "ol" : "ul" });
const check = (checked: boolean, ...children: Node[]) => block("listitem", children, { value: 1, checked });
const code = (value: string, language = "") => block("code", [text(value)], { language });
const doc = (...children: Node[]) => ({
  root: { type: "root", version: 1, format: "", indent: 0, direction: null, children },
});

/** Structure + text + formats, ignoring cosmetic JSON fields. */
function shape(document: unknown): string {
  const lines: string[] = [];
  const walk = (node: Node, depth: number) => {
    const bits = [String(node.type)];
    if (node.type === "text") {
      bits.push(JSON.stringify(node.text));
      if (node.format) bits.push(`f${String(node.format)}`);
    }
    if (node.type === "list") bits.push(String(node.listType));
    if (node.type === "heading") bits.push(String(node.tag));
    if (typeof node.checked === "boolean") bits.push(node.checked ? "[x]" : "[ ]");
    lines.push("  ".repeat(depth) + bits.join(" "));
    // Adjacent text runs with the same format are one run to a reader.
    const kids = (node.children as Node[] | undefined) ?? [];
    const merged: Node[] = [];
    for (const kid of kids) {
      const prev = merged[merged.length - 1];
      if (prev && prev.type === "text" && kid.type === "text" && (prev.format ?? 0) === (kid.format ?? 0)) {
        merged[merged.length - 1] = { ...prev, text: String(prev.text) + String(kid.text) };
      } else {
        merged.push(kid);
      }
    }
    for (const kid of merged) walk(kid, depth + 1);
  };
  for (const child of (document as { root: { children: Node[] } }).root.children) walk(child, 0);
  return lines.join("\n");
}

/**
 * Save → reopen must give back the same document (or `expected`, for the one
 * deliberate normalisation: invisible whitespace at the end of a line), and
 * saving again must write the same file.
 */
function expectLossless(document: unknown, label = "", expected: unknown = document) {
  const saved = toMarkdown(document);
  const reopened = toJSON(saved);
  expect(shape(reopened), `${label}\nsaved as ${JSON.stringify(saved)}`).toBe(shape(expected));
  expect(toMarkdown(reopened), `${label}: second save changed the file`).toBe(saved);
  return saved;
}

// Everything a person might type that means something to markdown — or to us.
const TYPED = [
  // block syntax at the start of a line
  "1. not a list", "1) paren", "2026. a year", "10. ten", "- dash", "+ plus", "* star", "# not a heading",
  "###### six", "####### seven", "> not a quote", ">no space", "| a | b |", "|", "||", "---", "***", "___",
  "- - -", "[ ] box", "[x] done", "[X] DONE", "- [ ] fake task", "```", "```js", "~~~", "    four spaces",
  "\ttab first", "=== ", "===", "--- ",
  // inline syntax typed literally
  "*stars*", "**double**", "_under_", "__dunder__", "~~strike~~", "`tick`", "a * b * c", "2*3*4",
  "snake_case_name", "[text](url)", "see [a](b) here", "![img](x)", "[just brackets]", "[a] (b)", "a](b",
  "<b>html</b>", "a < b > c", "<https://x.y>", "https://example.com/a_b*c?d=1&e=2",
  // references and escapes
  "&#35;", "&#8203;", "&amp; &lt; &copy;", "&#x41;", "& alone", "back\\slash", "\\*", "\\", "a\\",
  "C:\\path\\to", "\\# not escaped",
  // whitespace
  "trailing  ", "trailing\t", "  leading", "a  b   c", "tab\tinside",
  // unicode
  "emoji 🎌🍜 👩‍👩‍👧", "日本語テキスト", "مرحبا بالعالم", "e\u0301 combining", "non\u00a0breaking", "zero\u200bwidth",
  // everyday prose
  "100%", "1.5 kg", "x^2", "\"quotes\" and 'single'", "ellipsis…", "—em dash", ":emoji:", "$5 and $10",
  "a|b", "@someone", "#hashtag", "ends with a period.",
];

// Typed on purpose as Papyra/Obsidian syntax; read back as that syntax by design.
const SEMANTIC = new Set<string>([]);

describe("typed text survives save → reopen", () => {
  const contexts: [string, (value: string) => ReturnType<typeof doc>][] = [
    ["paragraph", (value) => doc(p(text(value)))],
    ["second line of a paragraph", (value) => doc(p(text("first"), br(), text(value)))],
    ["after text on the same line", (value) => doc(p(text("lead "), text(value)))],
    ["bold", (value) => doc(p(text(value, 1)))],
    ["italic", (value) => doc(p(text(value, 2)))],
    ["bullet item", (value) => doc(list("bullet", item(1, text(value))))],
    ["numbered item", (value) => doc(list("number", item(1, text(value))))],
    ["checklist item", (value) => doc(list("check", check(false, text(value))))],
    ["heading", (value) => doc(h("h2", text(value)))],
    ["quote", (value) => doc(quote(text(value)))],
  ];

  for (const [context, build] of contexts) {
    describe(context, () => {
      for (const value of TYPED) {
        if (SEMANTIC.has(value)) continue;
        // Formatting markers can't wrap text that is only whitespace, and a
        // heading/list item/quote ignores surrounding whitespace by definition.
        const bounded = context !== "paragraph" && context !== "second line of a paragraph"
          && context !== "after text on the same line";
        if (bounded && value !== value.trim()) continue;
        // Whitespace at the end of a line is invisible and is dropped on save.
        const kept = value.replace(/[ \t]+$/, "");
        it(JSON.stringify(value), () => expectLossless(build(value), `${context}: ${value}`, build(kept)));
      }
    });
  }
});

describe("blank lines", () => {
  const KINDS: [string, () => Node][] = [
    ["paragraph", () => p(text("words"))],
    ["heading", () => h("h1", text("Title"))],
    ["bullets", () => list("bullet", item(1, text("a")), item(2, text("b")))],
    ["numbers", () => list("number", item(1, text("one")), item(2, text("two")))],
    ["checklist", () => list("check", check(true, text("done")), check(false, text("todo")))],
    ["quote", () => quote(text("quoted"))],
    ["code", () => code("let x = 1;")],
  ];

  for (const [aName, a] of KINDS) {
    for (const [bName, b] of KINDS) {
      for (const blanks of [0, 1, 2, 3]) {
        // Two lists of one kind with nothing between are one list in markdown
        // (and the editor merges them the same way), so there is no shape to keep.
        if (blanks === 0 && aName === bName && ["bullets", "numbers", "checklist"].includes(aName)) continue;
        it(`${blanks} blank line(s) between ${aName} and ${bName}`, () => {
          expectLossless(doc(a(), ...Array.from({ length: blanks }, () => p()), b()));
        });
      }
    }
  }

  it("the reported case: a blank line between a nested list and the next heading line", () => {
    const md = [
      "Things to buy:", "", "1. Ramen Bowl Set", "    1. Sometsuke", "    2. Mino-yaki",
      "", "Things to experience:", "", "1. Meiji Jingu",
    ].join("\n");
    const opened = toJSON(md) as { root: { children: Node[] } };
    opened.root.children.splice(2, 0, p()); // Enter on an empty line after "b."
    const saved = expectLossless(opened);
    expect(saved).toContain("Mino-yaki\n\n\nThings to experience:");
  });

  for (const leading of [1, 2, 3]) {
    it(`${leading} leading blank line(s)`, () => {
      expectLossless(doc(...Array.from({ length: leading }, () => p()), p(text("body"))));
    });
  }

  for (const trailing of [1, 2, 3]) {
    it(`${trailing} trailing blank line(s)`, () => {
      expectLossless(doc(p(text("body")), ...Array.from({ length: trailing }, () => p())));
    });
  }

  it("blanks everywhere at once", () => {
    expectLossless(doc(p(), p(text("a")), p(), p(), list("bullet", item(1, text("x"))), p(), code("c"), p(), p()));
  });

  it("an empty document is one empty paragraph and saves as nothing", () => {
    expect(toMarkdown(doc(p()))).toBe("");
    expect(shape(toJSON(""))).toBe("paragraph");
    expect(shape(toJSON("\n\n\n"))).toBe("paragraph");
  });

  it("a whitespace-only line is a blank line (and stays one)", () => {
    const saved = toMarkdown(doc(p(text("x")), p(text("   ")), p(text("y"))));
    expect(shape(toJSON(saved))).toBe(shape(doc(p(text("x")), p(), p(text("y")))));
  });

  it("stored plainly — as extra blank lines a person or another app would write", () => {
    expect(toMarkdown(doc(p(text("a")), p(), p(text("b"))))).toBe("a\n\n\nb");
    expect(toMarkdown(doc(p(), p(text("b"))))).toBe("\nb");
    expect(toMarkdown(doc(p(text("a")), p()))).toBe("a\n\n");
  });

  it("a file ending in a single newline has no trailing blank paragraph", () => {
    expect(shape(toJSON("a\n"))).toBe(shape(doc(p(text("a")))));
  });

  it("blank lines inside code are never touched", () => {
    const withBlanks = "```\na\n\n\n\nb\n```";
    const saved = toMarkdown(toJSON(withBlanks));
    expect(saved).toBe(withBlanks);
  });
});

describe("line breaks inside a paragraph (Shift+Enter)", () => {
  const cases: [string, Node[]][] = [
    ["one", [text("a"), br(), text("b")]],
    ["at the end", [text("a"), br()]],
    ["two at the end", [text("a"), br(), br()]],
    ["at the start", [br(), text("b")]],
    ["an empty line between", [text("a"), br(), br(), text("b")]],
    ["two empty lines between", [text("a"), br(), br(), br(), text("b")]],
    ["only a break", [br()]],
    ["syntax on the next line", [text("a"), br(), text("1. b"), br(), text("# c"), br(), text("> d")]],
  ];
  for (const [name, children] of cases) {
    it(name, () => expectLossless(doc(p(...children), p(text("after")))));
  }
  it("trailing spaces before a break are dropped, once", () => {
    expectLossless(doc(p(text("a  "), br(), text("b"))), "", doc(p(text("a"), br(), text("b"))));
  });
  it("a blank line inside a quote stays a quote line", () => {
    expectLossless(doc(quote(text("one"), br(), br(), text("three"))));
  });
});

describe("inline code", () => {
  for (const value of ["plain", "a`b", "`", "``", "a``b", "`edge`", "``` fence", " padded ", "a*b_c", "<tag>", "&#35;"]) {
    it(JSON.stringify(value), () => expectLossless(doc(p(text("x "), text(value, 16), text(" y")))));
  }
  it("reads a double-backtick span from another editor", () => {
    expect(shape(toJSON("x `` a`b `` y"))).toBe(shape(doc(p(text("x "), text("a`b", 16), text(" y")))));
  });
});

describe("code blocks", () => {
  for (const [name, value] of [
    ["simple", "print(1)"], ["blank line inside", "a\n\nb"], ["several blank lines", "a\n\n\n\nb"],
    ["indented", "  indented\n\tTabbed"], ["markdown-looking", "# not\n- a\n> list\n1. x"],
    ["backtick fence inside", "```\ninner\n```"], ["html", "<div>x</div>"], ["unicode", "日本 🎌"],
  ] as const) {
    it(name, () => expectLossless(doc(p(text("before")), code(value, "python"), p(text("after")))));
  }
});

describe("formatting combinations", () => {
  for (const [name, children] of [
    ["bold", [text("b", 1)]], ["italic", [text("i", 2)]], ["bold italic", [text("bi", 3)]],
    ["strike", [text("s", 4)]], ["mixed run", [text("a "), text("b", 1), text(" c "), text("d", 2)]],
    ["adjacent formats", [text("x", 1), text("y", 2)]],
    ["bold with syntax inside", [text("1. # > |", 1)]],
    ["bold at line start after break", [text("a"), br(), text("- b", 1)]],
  ] as const) {
    it(name, () => expectLossless(doc(p(...(children as unknown as Node[])))));
  }
});

describe("never loses content on import", () => {
  for (const md of [
    "| a | b |", "|", "||", "| a |\n| b |", "| not | a |\n| table | row |", "| h |\n|---|\n| 1 |",
    "", "\n", "   ", "\n\n\n", "\t",
  ]) {
    it(JSON.stringify(md), () => {
      const opened = toJSON(md);
      expect((opened as { root: { children: unknown[] } }).root.children.length).toBeGreaterThan(0);
      const words = md.replace(/[|\-\s]/g, "");
      if (words) expect(JSON.stringify(opened)).toContain(words.split("")[0]);
      expect(() => toMarkdown(opened)).not.toThrow();
    });
  }
});

describe("foreign markdown settles after one save", () => {
  for (const md of [
    "# Title\n\nPara one.\nSoft wrapped line.\n\n## Sub\n\n- a\n- b\n    - c\n\n1. x\n2. y",
    "- [ ] task\n- [x] done\n\n> quote\n> more\n\n```js\nconst a = 1;\n```",
    "Para\n\n\n\nAfter three blanks",
    "\n\nStarts with blanks",
    "Text with trailing spaces   \nnext",
    "* star bullets\n* two",
    "| a | b |\n| --- | --- |\n| 1 | 2 |",
    "Line one  \nhard break",
    "Escaped \\* star and \\_ underscore",
    "A [link](https://x.y) and ![img](a.png)",
    "---\n\nAfter a rule",
    "Tabs\tin\ttext",
  ]) {
    it(JSON.stringify(md.slice(0, 40)), () => {
      const once = toMarkdown(toJSON(md));
      const twice = toMarkdown(toJSON(once));
      expect(twice).toBe(once);
      expect(shape(toJSON(twice))).toBe(shape(toJSON(once)));
    });
  }
});

describe("scale", () => {
  it("a long note with blank lines everywhere round-trips quickly", () => {
    const children: Node[] = [];
    for (let i = 0; i < 1500; i++) {
      children.push(p(text(`Line ${i} with 1. and # and | inside`)));
      if (i % 3 === 0) children.push(p());
      if (i % 50 === 0) children.push(list("number", item(1, text(`item ${i}`))));
    }
    const started = performance.now();
    expectLossless(doc(...children));
    expect(performance.now() - started).toBeLessThan(15000);
  });
});
