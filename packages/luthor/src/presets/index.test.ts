/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { presetRegistry } from "./index";

describe("presetRegistry", () => {
  it("includes active preset ids only", () => {
    expect(Object.keys(presetRegistry).sort()).toEqual([
      "extensive",
      "html-editor",
      "legacy-rich",
      "md-editor",
      "papyra",
    ]);
  });

  it("keeps stable identifiers for active preset ids", () => {
    expect(presetRegistry.extensive?.id).toBe("extensive");
    expect(presetRegistry["legacy-rich"]?.id).toBe("legacy-rich");
    expect(presetRegistry["md-editor"]?.id).toBe("md-editor");
    expect(presetRegistry["html-editor"]?.id).toBe("html-editor");
    expect(presetRegistry.papyra?.id).toBe("papyra");
  });
});
