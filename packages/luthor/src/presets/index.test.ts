import { describe, expect, it } from "vitest";
import { presetRegistry } from "./index";

describe("presetRegistry", () => {
  it("includes active preset ids only", () => {
    expect(Object.keys(presetRegistry).sort()).toEqual([
      "compose",
      "extensive",
      "headless-editor",
      "html-editor",
      "legacy-rich",
      "md-editor",
      "simple-editor",
      "slash-editor",
    ]);
  });

  it("keeps stable identifiers for active preset ids", () => {
    expect(presetRegistry.extensive?.id).toBe("extensive");
    expect(presetRegistry.compose?.id).toBe("compose");
    expect(presetRegistry["simple-editor"]?.id).toBe("simple-editor");
    expect(presetRegistry["headless-editor"]?.id).toBe("headless-editor");
    expect(presetRegistry["legacy-rich"]?.id).toBe("legacy-rich");
    expect(presetRegistry["md-editor"]?.id).toBe("md-editor");
    expect(presetRegistry["slash-editor"]?.id).toBe("slash-editor");
    expect(presetRegistry["html-editor"]?.id).toBe("html-editor");
  });
});
