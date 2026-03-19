import { describe, expect, it } from "vitest";
import { __TEST_ONLY_LIST_INTERNALS } from "./ListExtension";

describe("ListExtension unordered pattern internals", () => {
  it("exposes exactly the supported unordered pattern set", () => {
    expect(__TEST_ONLY_LIST_INTERNALS.unorderedPatternKeys).toEqual([
      "disc-circle-square",
      "arrow-diamond-disc",
      "square-square-square",
      "arrow-circle-square",
    ]);
  });

  it("normalizes legacy pattern tokens to supported patterns", () => {
    const resolve = __TEST_ONLY_LIST_INTERNALS.resolveUnorderedPatternToken;

    expect(resolve("disc-arrow-square")).toBe("arrow-circle-square");
    expect(resolve("square-circle-disc")).toBe("disc-circle-square");
    expect(resolve("arrow-diamond-square")).toBe("arrow-diamond-disc");
    expect(resolve("star-circle-square")).toBe("disc-circle-square");
  });

  it("falls back to default pattern for unknown or empty tokens", () => {
    const resolve = __TEST_ONLY_LIST_INTERNALS.resolveUnorderedPatternToken;

    expect(resolve("")).toBe("disc-circle-square");
    expect(resolve("unknown-pattern")).toBe("disc-circle-square");
    expect(resolve(null)).toBe("disc-circle-square");
  });

  it("maps marker styles to normalized marker kinds", () => {
    const marker = __TEST_ONLY_LIST_INTERNALS.resolveUnorderedMarkerKind;

    expect(marker("disc")).toBe("disc");
    expect(marker("circle")).toBe("circle");
    expect(marker("square")).toBe("square");
    expect(marker('"\\25B8"')).toBe("arrow");
    expect(marker('"\\27A4"')).toBe("arrow");
    expect(marker('"\\25C6"')).toBe("diamond");
    expect(marker('"\u25b8"')).toBe("arrow");
    expect(marker('"\u25c6"')).toBe("diamond");
  });

  it("exposes exactly the supported checklist variant set", () => {
    expect(__TEST_ONLY_LIST_INTERNALS.checkListVariants).toEqual([
      "strikethrough",
      "plain",
    ]);
  });

  it("clears unordered marker style tokens while preserving unrelated styles", () => {
    let styleText = [
      "--luthor-unordered-marker-kind: disc",
      '--luthor-unordered-marker-content: "bullet"',
      "color: red",
    ].join("; ");
    const node = {
      getStyle: () => styleText,
      setStyle: (nextStyle: string) => {
        styleText = nextStyle;
      },
    };

    __TEST_ONLY_LIST_INTERNALS.clearUnorderedMarkerStyleTokens(node);

    expect(styleText).toContain("color: red");
    expect(styleText).not.toContain("--luthor-unordered-marker-kind");
    expect(styleText).not.toContain("--luthor-unordered-marker-content");
  });

  it("keeps style text unchanged when unordered marker style tokens are absent", () => {
    let styleText = "color: red; font-weight: 600";
    const node = {
      getStyle: () => styleText,
      setStyle: (nextStyle: string) => {
        styleText = nextStyle;
      },
    };

    __TEST_ONLY_LIST_INTERNALS.clearUnorderedMarkerStyleTokens(node);

    expect(styleText).toBe("color: red; font-weight: 600");
  });
});
