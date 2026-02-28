import { describe, expect, it } from "vitest";
import { formatMarkdownSource } from "./source-format";

describe("formatMarkdownSource", () => {
  it("decodes lexical whitespace entities in markdown output", () => {
    expect(formatMarkdownSource("This is a **bold&#32;**line")).toBe("This is a **bold** line");
  });

  it("handles whitespace entities for multiple text formats", () => {
    expect(formatMarkdownSource("*it&#32;*x ~~st&#32;~~y")).toBe("*it* x ~~st~~ y");
  });

  it("normalizes marker-contained spaces without entities", () => {
    expect(formatMarkdownSource("Let's **test **this")).toBe("Let's **test** this");
  });
});
