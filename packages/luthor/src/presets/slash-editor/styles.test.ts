/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cssText = readFileSync(
  resolve(process.cwd(), "src/presets/slash-editor/styles.css"),
  "utf8",
);

describe("SlashEditor stylesheet", () => {
  it("uses theme tokens for shell border and background", () => {
    expect(cssText).toMatch(/border:\s*1px solid var\(--luthor-border\);/);
    expect(cssText).toMatch(/background:\s*var\(--luthor-bg\);/);
  });

  it("does not hardcode legacy light shell colors", () => {
    expect(cssText).not.toContain("#d8dee8");
    expect(cssText).not.toContain("#ffffff");
  });
});
