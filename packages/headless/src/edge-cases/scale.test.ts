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
 * Documents that are large, deep, or wide must convert without hanging
 * the main thread. The budgets below are deliberately loose — they exist
 * to catch an accidental quadratic, not to police milliseconds, and CI
 * machines are slower than laptops. The measured numbers are recorded in
 * the test names' assertions so a future regression shows up as a real
 * multiple rather than noise.
 */

const NONE = { metadataMode: "none" as const };

// Generous: a real regression here is 10-100x, not 2x.
const BUDGET_MS = 10_000;

function measure<T>(run: () => T): { result: T; ms: number } {
  const start = performance.now();
  const result = run();
  return { result, ms: performance.now() - start };
}

function countBlocks(document: unknown): number {
  return ((document as { root?: { children?: unknown[] } }).root?.children ?? []).length;
}

describe("large documents", () => {
  it("converts a 10k-block markdown document in both directions", () => {
    const source = Array.from({ length: 10_000 }, (_, index) => `Paragraph ${index}`).join(
      "\n\n",
    );

    const parse = measure(() => markdownToJSON(source, NONE));
    expect(countBlocks(parse.result)).toBe(10_000);
    expect(parse.ms).toBeLessThan(BUDGET_MS);

    const serialize = measure(() => jsonToMarkdown(parse.result, NONE));
    expect(serialize.result).toContain("Paragraph 9999");
    expect(serialize.ms).toBeLessThan(BUDGET_MS);
  });

  it("handles a single 100k-character paragraph without truncation", () => {
    const paragraph = "x".repeat(100_000);

    const parse = measure(() => markdownToJSON(paragraph, NONE));
    expect(parse.ms).toBeLessThan(BUDGET_MS);

    const markdown = jsonToMarkdown(parse.result, NONE);
    // Length, not just containment: a truncating bug would still "contain".
    expect(markdown.trim().length).toBe(100_000);
  });

  it("handles a deeply nested list without stack overflow", () => {
    const depth = 100;
    const lines = Array.from(
      { length: depth },
      (_, index) => `${"  ".repeat(index)}- level ${index}`,
    );

    const parse = measure(() => markdownToJSON(lines.join("\n"), NONE));
    expect(parse.ms).toBeLessThan(BUDGET_MS);

    const markdown = jsonToMarkdown(parse.result, NONE);
    expect(markdown).toContain("level 0");
    expect(markdown).toContain(`level ${depth - 1}`);
  });

  it("handles a wide table", () => {
    const columns = 50;
    const header = `| ${Array.from({ length: columns }, (_, i) => `h${i}`).join(" | ")} |`;
    const divider = `| ${Array.from({ length: columns }, () => "---").join(" | ")} |`;
    const row = `| ${Array.from({ length: columns }, (_, i) => `c${i}`).join(" | ")} |`;

    const parse = measure(() => markdownToJSON([header, divider, row].join("\n"), NONE));
    expect(parse.ms).toBeLessThan(BUDGET_MS);

    const markdown = jsonToMarkdown(parse.result, NONE);
    expect(markdown).toContain(`h${columns - 1}`);
    expect(markdown).toContain(`c${columns - 1}`);
  });
});

describe("large documents through the HTML bridge", () => {
  it("sanitizes and converts a 5k-block HTML document within budget", () => {
    // Exercises the item-1b sanitizer at scale: it walks every node, so a
    // quadratic there would surface here first.
    const html = Array.from(
      { length: 5_000 },
      (_, index) => `<p>Paragraph ${index}</p>`,
    ).join("");

    const parse = measure(() => htmlToJSON(html, NONE));
    expect(countBlocks(parse.result)).toBe(5_000);
    expect(parse.ms).toBeLessThan(BUDGET_MS);

    const serialize = measure(() => jsonToHTML(parse.result, NONE));
    expect(serialize.result).toContain("Paragraph 4999");
    expect(serialize.ms).toBeLessThan(BUDGET_MS);
  });

  it("does not degrade quadratically as document size grows", () => {
    const build = (count: number) =>
      Array.from({ length: count }, (_, index) => `<p>Paragraph ${index}</p>`).join("");

    const small = measure(() => htmlToJSON(build(1_000), NONE));
    const large = measure(() => htmlToJSON(build(4_000), NONE));

    // 4x the input should cost well under 16x (quadratic). The floor on
    // `small.ms` keeps a sub-millisecond measurement from making the ratio
    // meaningless on a fast machine.
    const ratio = large.ms / Math.max(small.ms, 1);
    expect(ratio).toBeLessThan(12);
  });
});
