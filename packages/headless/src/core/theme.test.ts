import { describe, expect, it } from "vitest";
import { defaultLuthorTheme } from "./theme";

describe("defaultLuthorTheme code highlighting classes", () => {
  it("includes prism class on code blocks", () => {
    expect(defaultLuthorTheme.code).toContain("prism-code");
  });

  it("maps code highlight tokens to prism and fallback classes", () => {
    expect(defaultLuthorTheme.codeHighlight?.keyword).toContain("token");
    expect(defaultLuthorTheme.codeHighlight?.keyword).toContain("keyword");
    expect(defaultLuthorTheme.codeHighlight?.keyword).toContain("luthor-code-keyword");
  });
});
