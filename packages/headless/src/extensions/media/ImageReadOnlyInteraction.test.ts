/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { shouldShowImageResizeHandles } from "./ImageExtension";

describe("image read-only interaction helpers", () => {
  it("hides image resize handles when editor is non-editable", () => {
    expect(shouldShowImageResizeHandles(false, true, false, true)).toBe(false);
    expect(shouldShowImageResizeHandles(true, true, false, true)).toBe(true);
  });

  it("requires both selection and image resizable flag", () => {
    expect(shouldShowImageResizeHandles(true, false, false, true)).toBe(false);
    expect(shouldShowImageResizeHandles(true, true, false, false)).toBe(false);
  });
});
