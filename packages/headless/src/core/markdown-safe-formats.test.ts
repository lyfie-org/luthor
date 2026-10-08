/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isTextNode,
  createEditor,
  type LexicalEditor,
  type LexicalNode,
  type TextFormatType,
} from "lexical";
import { jsonToMarkdown, markdownToJSON } from "./markdown";
import {
  normalizeFormatBoundaries,
  registerMarkdownSafeFormats,
  repairEmphasis,
} from "./markdown-safe-formats";

type Seg = [text: string, ...formats: TextFormatType[]];

const FORMATS: TextFormatType[] = ["bold", "italic", "strikethrough", "highlight", "underline", "code"];

/** Text runs of a document as `text|bold,italic`. */
function runs(nodes: LexicalNode[]): string[] {
  const out: string[] = [];
  const walk = (n: LexicalNode) => {
    if ($isTextNode(n)) {
      const f = FORMATS.filter((x) => n.hasFormat(x)).join(",");
      out.push(f ? `${n.getTextContent()}|${f}` : n.getTextContent());
    } else if ($isElementNode(n)) {
      n.getChildren().forEach(walk);
    }
  };
  nodes.forEach(walk);
  return out;
}

const readRuns = (editor: LexicalEditor) => editor.getEditorState().read(() => runs($getRoot().getChildren()));

function editorWith(segs: Seg[], guarded: boolean) {
  const editor = createEditor({ onError: (e) => { throw e; } });
  if (guarded) registerMarkdownSafeFormats(editor);
  editor.update(() => {
    const p = $createParagraphNode();
    for (const [text, ...formats] of segs) {
      const t = $createTextNode(text);
      for (const f of formats) t.toggleFormat(f);
      p.append(t);
    }
    $getRoot().clear().append(p);
  }, { discrete: true });
  return editor;
}

const OPTIONS = { metadataMode: "none" as const };

function reopen(markdown: string): string[] {
  const editor = createEditor({ onError: (e) => { throw e; } });
  editor.setEditorState(editor.parseEditorState(JSON.stringify(markdownToJSON(markdown, OPTIONS))));
  return readRuns(editor);
}

// Each pairs what was pasted with what the editor shows (and saves) instead.
const CASES: [Seg[], string[]][] = [
  [[["Mix:", "bold"], ["60g atta"]], ["Mix|bold", ":60g atta"]],
  [[["1.Thursday 2:30 PM: The Initial Mix:", "bold"], ["60g"]], ["1.Thursday 2:30 PM: The Initial Mix|bold", ":60g"]],
  [[["1.", "bold"], ["Thursday"]], ["1|bold", ".Thursday"]],
  [[["word"], ["(bold)", "bold"], ["word"]], ["word(", "bold|bold", ")word"]],
  [[["gone,", "strikethrough"], ["x"]], ["gone|strikethrough", ",x"]],
  [[["italic.", "italic"], ["next"]], ["italic|italic", ".next"]],
  [[["mark!", "highlight"], ["x"]], ["mark|highlight", "!x"]],
  [[["under:", "underline"], ["x"]], ["under|underline", ":x"]],
  [[["both:", "bold", "italic"], ["x"]], ["both|bold,italic", ":x"]],
  [[["Mix ", "bold"], ["60g"]], ["Mix|bold", " 60g"]],
  [[["x"], [" lead", "bold"]], ["x ", "lead|bold"]],
  [[["a"], ["b", "bold"], ["c"]], ["a", "b|bold", "c"]],
  [[["Mix:", "bold"], [" 60g"]], ["Mix|bold", ": 60g"]],
  [[["!!", "bold"], ["x"]], ["!|bold", "!x"]],
  [[["!", "bold"], ["x"]], ["!x"]],
  [[["Day 1 (Thu):", "bold"], ["mix"]], ["Day 1 (Thu)|bold", ":mix"]],
];

describe("registerMarkdownSafeFormats", () => {
  it.each(CASES)("%j shows as it will reopen", (segs, expected) => {
    const editor = editorWith(segs, true);
    expect(readRuns(editor)).toEqual(expected);
    expect(reopen(jsonToMarkdown(editor.getEditorState().toJSON(), OPTIONS))).toEqual(expected);
  });

  it("leaves well-formed runs, the run being typed and inline code alone", () => {
    for (const segs of [
      [["Mix:", "bold"], [" 60g"]],
      [["ends here:", "bold"]],
      [["typing bold ", "bold"]],
      [["(", "bold"], ["x", "bold", "italic"]],
      [["a:", "bold", "code"], ["b"]],
    ] as Seg[][]) {
      expect(readRuns(editorWith(segs, true))).toEqual(readRuns(editorWith(segs, false)));
    }
  });
});

describe("normalizeFormatBoundaries (export)", () => {
  it.each(CASES)("%j exports as markdown that reopens as the same formatting", (segs, expected) => {
    // No live guard: the document arrives as pasted, the export fixes it.
    const document = editorWith(segs, false).getEditorState().toJSON();
    const markdown = jsonToMarkdown(document, OPTIONS);
    expect(reopen(markdown)).toEqual(expected);
  });

  it("writes the pasted recipe line as bold, not literal asterisks", () => {
    const document = editorWith([["1.Thursday 2:30 PM: The Initial Mix:", "bold"], ["60g atta"]], false).getEditorState().toJSON();
    expect(jsonToMarkdown(document, OPTIONS)).toBe("**1.Thursday 2:30 PM: The Initial Mix**:60g atta");
  });

  it("returns a safe document untouched, and never mutates its input", () => {
    const safe = editorWith([["Mix", "bold"], [": 60g"]], false).getEditorState().toJSON();
    expect(normalizeFormatBoundaries(safe)).toBe(safe);

    const unsafe = editorWith([["Mix:", "bold"], ["60g"]], false).getEditorState().toJSON();
    const before = JSON.stringify(unsafe);
    expect(normalizeFormatBoundaries(unsafe)).not.toBe(unsafe);
    expect(JSON.stringify(unsafe)).toBe(before);
  });
});

describe("repairEmphasis (import)", () => {
  it.each([
    ["**Mix:**60g atta", "**Mix**:60g atta", ["Mix|bold", ":60g atta"]],
    ["**1.Thursday 2:30 PM: The Initial Mix:**60g atta", "**1.Thursday 2:30 PM: The Initial Mix**:60g atta", ["1.Thursday 2:30 PM: The Initial Mix|bold", ":60g atta"]],
    ["**1.**Thursday", "**1**.Thursday", ["1|bold", ".Thursday"]],
    ["word**(bold)**word", "word(**bold**)word", ["word(", "bold|bold", ")word"]],
    ["~~gone,~~x", "~~gone~~,x", ["gone|strikethrough", ",x"]],
    ["*italic.*next", "*italic*.next", ["italic|italic", ".next"]],
    ["***both:***x", "***both***:x", ["both|bold,italic", ":x"]],
    ["==mark!==x", "==mark==!x", ["mark|highlight", "!x"]],
    ["++under:++x", "++under++:x", ["under|underline", ":x"]],
    ["**!!**x", "**!**!x", ["!|bold", "!x"]],
    ["**!**x", "!x", ["!x"]],
    ["**Day 1 (Thu):**mix", "**Day 1 (Thu)**:mix", ["Day 1 (Thu)|bold", ":mix"]],
  ])("%s → %s", (input, repaired, shown) => {
    expect(repairEmphasis(input)).toBe(repaired);
    // The bridge repairs on its own: the broken file opens as formatting.
    expect(reopen(input)).toEqual(shown);
  });

  it.each([
    "**Mix:** 60g",
    "a**b**c",
    "2*3*4",
    "a*(b)*c",
    "\\*\\*Mix:\\*\\*60g",
    "use `**Mix:**60g` literally",
    "** spaced **x",
    "plain text, no markers",
    "- **Item:** detail\n1. **Step**: two",
  ])("leaves %j unchanged", (input) => {
    expect(repairEmphasis(input)).toBe(input);
  });

  it("skips fenced code", () => {
    const md = "before **a:**b\n```\n**a:**b\n```\nafter **c:**d";
    expect(repairEmphasis(md)).toBe("before **a**:b\n```\n**a:**b\n```\nafter **c**:d");
  });

  it("is stable: a repaired file saves back byte for byte", () => {
    const md = "**1.Thursday 2:30 PM: The Initial Mix:**60g atta + 60g water.\nPut your jar on the scale.";
    const saved = jsonToMarkdown(markdownToJSON(md, OPTIONS), OPTIONS);
    expect(saved).toBe("**1.Thursday 2:30 PM: The Initial Mix**:60g atta + 60g water.\nPut your jar on the scale.");
    expect(jsonToMarkdown(markdownToJSON(saved, OPTIONS), OPTIONS)).toBe(saved);
  });
});
