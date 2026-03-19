import { describe, expect, it } from "vitest";
import { CodeExtension } from "./CodeExtension";

describe("CodeExtension defaults", () => {
  it("enables syntax highlighting by default", () => {
    const extension = new CodeExtension() as CodeExtension & {
      config: {
        syntaxHighlighting?: "auto" | "disabled";
      };
    };
    expect(extension.config.syntaxHighlighting).toBe("auto");
  });

  it("shows code line numbers by default", () => {
    const extension = new CodeExtension() as CodeExtension & {
      config: {
        showLineNumbers?: boolean;
      };
    };
    expect(extension.config.showLineNumbers).toBe(true);
  });
});
