import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cssText = readFileSync(resolve(process.cwd(), "src/core/styles.css"), "utf8");

describe("codeblock highlight css scoping", () => {
  it("applies prism fallback colors to every editor wrapper preset", () => {
    expect(cssText).toMatch(
      /^\s*\.luthor-editor-wrapper \.luthor-code-block\[data-theme="prism"\]\s*\{/m,
    );
    expect(cssText).toMatch(
      /\.luthor-editor-wrapper \.luthor-code-block\[data-theme="prism"\][\s\S]*?background:\s*var\(--luthor-codeblock-bg,\s*var\(--luthor-muted\)\)\s*!important;/m,
    );
  });

  it("does not scope prism fallback colors only to extensive preset", () => {
    expect(cssText).not.toMatch(
      /^\s*\.luthor-preset-extensive\.luthor-editor-wrapper \.luthor-code-block\[data-theme="prism"\]\s*\{/m,
    );
  });
});
