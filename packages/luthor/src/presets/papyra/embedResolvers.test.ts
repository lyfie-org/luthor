/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it, vi } from "vitest";
import { createFallbackPapyraAdapter, type PapyraEditorAdapter } from "./adapter";
import { createPapyraEmbedResolvers } from "./embeds";

describe("createPapyraEmbedResolvers", () => {
  it("hands a transcluded block to the host's renderBlock, with its state", () => {
    const renderBlock = vi.fn(() => "drawn by the host");
    const adapter: PapyraEditorAdapter = { ...createFallbackPapyraAdapter(), renderBlock };
    const resolvers = createPapyraEmbedResolvers(adapter);

    const out = resolvers.renderBlock?.({ note: "Groceries", blockId: "checklist", status: "resolved", content: "- [ ] milk" });

    expect(out).toBe("drawn by the host");
    expect(renderBlock).toHaveBeenCalledWith({ note: "Groceries", blockId: "checklist", status: "resolved", content: "- [ ] milk" });
  });

  it("leaves renderBlock off when the host has none, so the default rendering stays", () => {
    const resolvers = createPapyraEmbedResolvers(createFallbackPapyraAdapter());
    expect(resolvers.renderBlock).toBeUndefined();
  });
});
