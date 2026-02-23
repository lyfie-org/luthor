import { describe, expect, it } from "vitest";
import { defaultLuthorTheme } from "./theme";

describe("defaultLuthorTheme code highlighting classes", () => {
  it("includes hljs class on code blocks", () => {
    expect(defaultLuthorTheme.code).toContain("hljs");
  });

  it("maps code highlight tokens to hljs and fallback classes", () => {
    expect(defaultLuthorTheme.codeHighlight?.keyword).toContain("hljs-keyword");
    expect(defaultLuthorTheme.codeHighlight?.keyword).toContain("luthor-code-keyword");
  });
});
