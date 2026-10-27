/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { createEditor } from "lexical";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { TransclusionNode, $createTransclusionNode } from "./TransclusionNode";
import { EmbedResolverProvider, type BlockRenderContext, type EmbedResolvers } from "./EmbedResolverContext";

afterEach(cleanup);

function decorated(note: string, blockId: string) {
  const editor = createEditor({
    namespace: "transclusion-render-test",
    nodes: [TransclusionNode],
    onError: (error) => {
      throw error;
    },
  });
  let node: TransclusionNode | undefined;
  editor.update(
    () => {
      node = $createTransclusionNode(note, blockId);
    },
    { discrete: true },
  );
  return node!.decorate();
}

function mount(resolvers: EmbedResolvers, note = "Groceries", blockId = "checklist") {
  return render(<EmbedResolverProvider resolvers={resolvers}>{decorated(note, blockId)}</EmbedResolverProvider>);
}

describe("TransclusionNode rendering", () => {
  it("shows a resolved block as quoted text by default", async () => {
    const { container } = mount({ resolveBlock: async () => "milk" });
    await waitFor(() => expect(container.querySelector(".luthor-transclusion--resolved")).not.toBeNull());
    expect(container.querySelector(".luthor-transclusion__content")?.textContent).toBe("milk");
  });

  it("lets the host draw the block, with its state: loading, then resolved", async () => {
    const seen: BlockRenderContext[] = [];
    const { container } = mount({
      resolveBlock: async () => "- [ ] milk",
      renderBlock: (ctx) => {
        seen.push(ctx);
        return <span data-testid="custom">{ctx.status}:{ctx.content ?? "-"}</span>;
      },
    });
    expect(screen.getByTestId("custom").textContent).toBe("loading:-");
    await waitFor(() => expect(screen.getByTestId("custom").textContent).toBe("resolved:- [ ] milk"));
    expect(container.querySelector(".luthor-transclusion--custom")?.getAttribute("data-luthor-transclusion-ref")).toBe("Groceries#^checklist");
    expect(container.querySelector(".luthor-transclusion__content")).toBeNull(); // the default is replaced, not added to
    expect(seen[0]).toMatchObject({ note: "Groceries", blockId: "checklist", status: "loading", content: null });
  });

  it("tells the host when a block can't be resolved, so it can say why", async () => {
    mount({
      resolveBlock: async () => null,
      renderBlock: (ctx) => <span data-testid="custom">{ctx.status}</span>,
    });
    await waitFor(() => expect(screen.getByTestId("custom").textContent).toBe("unresolved"));
  });

  it("keeps the default for a block the host declines (null)", async () => {
    const renderBlock = vi.fn(() => null);
    const { container } = mount({ resolveBlock: async () => "kept text", renderBlock });
    await waitFor(() => expect(container.querySelector(".luthor-transclusion--resolved")).not.toBeNull());
    expect(renderBlock).toHaveBeenCalled();
    expect(container.querySelector(".luthor-transclusion--custom")).toBeNull();
    expect(container.querySelector(".luthor-transclusion__content")?.textContent).toBe("kept text");
  });

  it("round-trips its markdown whatever draws it", () => {
    const editor = createEditor({ namespace: "t", nodes: [TransclusionNode], onError: (e) => { throw e; } });
    let text = "";
    editor.update(() => { text = $createTransclusionNode("Groceries", "checklist").getTextContent(); }, { discrete: true });
    expect(text).toBe("![[Groceries#^checklist]]");
  });
});
