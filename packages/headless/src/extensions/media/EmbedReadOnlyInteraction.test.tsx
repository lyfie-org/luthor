/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import {
  resolveEmbedPointerEvents,
  shouldShowEmbedResizeHandles,
} from "./IframeEmbedExtension";

describe("embed read-only interaction helpers", () => {
  it("keeps embeds interactive when editor is non-editable", () => {
    expect(resolveEmbedPointerEvents(false, false, false)).toBe("auto");
    expect(resolveEmbedPointerEvents(false, true, false)).toBe("auto");
  });

  it("keeps embeds inert while editable unless selected", () => {
    expect(resolveEmbedPointerEvents(true, false, false)).toBe("none");
    expect(resolveEmbedPointerEvents(true, true, true)).toBe("none");
    expect(resolveEmbedPointerEvents(true, true, false)).toBe("auto");
  });

  it("hides resize handles when editor is non-editable", () => {
    expect(shouldShowEmbedResizeHandles(false, true, false)).toBe(false);
    expect(shouldShowEmbedResizeHandles(true, true, false)).toBe(true);
  });
});
