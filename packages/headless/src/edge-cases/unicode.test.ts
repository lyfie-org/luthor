/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { markdownToJSON, jsonToMarkdown } from "../core/markdown";
import { htmlToJSON, jsonToHTML } from "../core/html";

/**
 * Text that is one "character" to a reader is frequently several code
 * units to JavaScript: ZWJ emoji sequences, skin-tone modifiers, combining
 * marks, and any astral-plane codepoint. Anything doing `.length`,
 * `.slice()`, or offset arithmetic on user text can split a grapheme in
 * half and corrupt the document.
 *
 * These assert the bridges are byte-exact for such text — a split
 * surrogate would surface as a replacement character or a shortened
 * string on the round-trip.
 */

const NONE = { metadataMode: "none" as const };

const SAMPLES: Array<{ label: string; text: string; codeUnits: number }> = [
  // ZWJ sequence: 4 people joined by U+200D, one visible glyph.
  { label: "family emoji (ZWJ)", text: "👨‍👩‍👧‍👦", codeUnits: 11 },
  // Base emoji + skin-tone modifier.
  { label: "skin-tone modifier", text: "👋🏽", codeUnits: 4 },
  // Flag: two regional indicator symbols.
  { label: "regional indicator flag", text: "🇯🇵", codeUnits: 4 },
  // Combining marks stacked on one base character.
  { label: "combining marks", text: "ẹ́́", codeUnits: 3 },
  // Devanagari cluster (base + vowel sign + virama).
  { label: "devanagari cluster", text: "क्षि", codeUnits: 4 },
  // Astral-plane CJK ideograph (surrogate pair).
  { label: "astral CJK", text: "𠮷", codeUnits: 2 },
  // Bare astral codepoint next to ASCII, the classic slice hazard.
  { label: "astral beside ascii", text: "a𝄞b", codeUnits: 4 },
];

function firstParagraphText(document: unknown): string {
  const root = (document as { root?: { children?: unknown[] } }).root;
  const parts: string[] = [];
  const visit = (node: unknown): void => {
    const record = node as { text?: string; children?: unknown[] };
    if (typeof record.text === "string") {
      parts.push(record.text);
    }
    for (const child of record.children ?? []) {
      visit(child);
    }
  };
  for (const child of root?.children ?? []) {
    visit(child);
  }
  return parts.join("");
}

describe("grapheme integrity through the markdown bridge", () => {
  for (const sample of SAMPLES) {
    it(`preserves ${sample.label} exactly`, () => {
      // Guards the fixture itself: if these counts drift the sample is no
      // longer testing what its label claims.
      expect(sample.text.length).toBe(sample.codeUnits);

      const document = markdownToJSON(`Before ${sample.text} after`, NONE);
      expect(firstParagraphText(document)).toContain(sample.text);

      const markdown = jsonToMarkdown(document, NONE);
      expect(markdown).toContain(sample.text);
      // Byte-exactness: no replacement char from a split surrogate.
      expect(markdown).not.toContain("�");
    });
  }

  it("survives a second round-trip unchanged (idempotent)", () => {
    const source = SAMPLES.map((sample) => sample.text).join(" ");
    const once = jsonToMarkdown(markdownToJSON(source, NONE), NONE);
    const twice = jsonToMarkdown(markdownToJSON(once, NONE), NONE);
    expect(twice).toBe(once);
    expect(once).toContain("👨‍👩‍👧‍👦");
  });
});

describe("grapheme integrity through the HTML bridge", () => {
  it("preserves every sample across html round-trip", () => {
    for (const sample of SAMPLES) {
      const document = htmlToJSON(`<p>x ${sample.text} y</p>`, NONE);
      expect(firstParagraphText(document)).toContain(sample.text);

      const html = jsonToHTML(document, NONE);
      expect(html).toContain(sample.text);
      expect(html).not.toContain("�");
    }
  });

  it("keeps emoji intact when adjacent to formatting boundaries", () => {
    // A naive offset split at the <strong> boundary would cut the ZWJ
    // sequence apart.
    const html = "<p><strong>👨‍👩‍👧‍👦</strong>tail</p>";
    const document = htmlToJSON(html, NONE);
    expect(firstParagraphText(document)).toBe("👨‍👩‍👧‍👦tail");
    expect(jsonToHTML(document, NONE)).toContain("👨‍👩‍👧‍👦");
  });
});
