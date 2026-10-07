/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cssText = readFileSync(resolve(process.cwd(), "src/core/styles.css"), "utf8");

describe("list marker CSS scoping", () => {
  it("scopes unordered marker selectors to unordered list containers", () => {
    expect(cssText).toMatch(
      /^\s*\.luthor-list-ul > \.luthor-list-li\[style\*="--luthor-unordered-marker-kind"]/m,
    );
    expect(cssText).toMatch(
      /^\s*\.luthor-list-ul > \.luthor-list-li\[style\*="--luthor-unordered-marker-kind: disc"]::before/m,
    );
    expect(cssText).toMatch(
      /^\s*\.luthor-list-ul > \.luthor-list-li\[style\*="--luthor-unordered-marker-kind: circle"]::before/m,
    );
    expect(cssText).toMatch(
      /^\s*\.luthor-list-ul > \.luthor-list-li\[style\*="--luthor-unordered-marker-kind: square"]::before/m,
    );
    expect(cssText).toMatch(
      /^\s*\.luthor-list-ul > \.luthor-list-li\[style\*="--luthor-unordered-marker-kind: diamond"]::before/m,
    );
    expect(cssText).toMatch(
      /^\s*\.luthor-list-ul > \.luthor-list-li\[style\*="--luthor-unordered-marker-kind: arrow"]::before/m,
    );
  });

  it("anchors the unordered marker to the first line, not the middle of the item", () => {
    const rule = cssText.match(
      /\.luthor-list-ul > \.luthor-list-li\[style\*="--luthor-unordered-marker-kind"]:not\(\.luthor-list-item-unchecked\):not\(\.luthor-list-item-checked\)::before\s*\{([^}]*)\}/,
    )?.[1];
    expect(rule).toBeDefined();
    // top: 50% centres the bullet on the whole item, so a wrapped item's bullet
    // floats between its lines.
    expect(rule).not.toMatch(/top:\s*50%/);
    expect(rule).toMatch(/top:\s*0\.5lh/);
  });

  it("does not define bare unordered marker selectors that can leak into ordered lists", () => {
    expect(cssText).not.toMatch(
      /^\s*\.luthor-list-li\[style\*="--luthor-unordered-marker-kind"]/m,
    );
  });
});
