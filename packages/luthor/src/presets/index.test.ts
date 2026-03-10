import { describe, expect, it } from "vitest";
import { presetRegistry } from "./index";

describe("presetRegistry", () => {
  it("includes canonical and legacy preset ids", () => {
    expect(Object.keys(presetRegistry).sort()).toEqual([
      "compose",
      "composer",
      "extensive",
      "headless-editor",
      "html-editor",
      "md-editor",
      "md-friendly",
      "notion-like",
      "slash-editor",
    ]);
  });

  it("keeps stable identifiers for both canonical and legacy ids", () => {
    expect(presetRegistry.extensive?.id).toBe("extensive");
    expect(presetRegistry["headless-editor"]?.id).toBe("headless-editor");
    expect(presetRegistry["md-editor"]?.id).toBe("md-editor");
    expect(presetRegistry["md-friendly"]?.id).toBe("md-friendly");
    expect(presetRegistry["slash-editor"]?.id).toBe("slash-editor");
    expect(presetRegistry["notion-like"]?.id).toBe("notion-like");
  });
});
