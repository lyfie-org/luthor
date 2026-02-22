import { describe, expect, it } from "vitest";
import { filterToolbarLayout, isToolbarItemVisible } from "./toolbar";
import type { ToolbarLayout } from "./types";

function createHasExtension(enabled: readonly string[]) {
  const enabledSet = new Set(enabled);
  return (name: string) => enabledSet.has(name);
}

describe("toolbar visibility filtering", () => {
  const layout: ToolbarLayout = {
    sections: [
      { items: ["bold", "fontFamily", "italic"] },
      { items: ["embed", "undo", "themeToggle"] },
    ],
  };

  it("keeps supported items visible by default", () => {
    const hasExtension = createHasExtension(["fontFamily", "history", "iframeEmbed"]);

    const filtered = filterToolbarLayout(layout, hasExtension);

    expect(filtered.sections).toEqual([
      { items: ["bold", "fontFamily", "italic"] },
      { items: ["embed", "undo", "themeToggle"] },
    ]);
  });

  it("hides explicitly disabled items", () => {
    const hasExtension = createHasExtension(["fontFamily", "history", "iframeEmbed"]);

    const filtered = filterToolbarLayout(layout, hasExtension, {
      bold: false,
      embed: false,
      themeToggle: false,
    });

    expect(filtered.sections).toEqual([
      { items: ["fontFamily", "italic"] },
      { items: ["undo"] },
    ]);
  });

  it("auto-hides unsupported items even when explicitly enabled", () => {
    const hasExtension = createHasExtension([]);

    expect(isToolbarItemVisible("fontFamily", hasExtension, { fontFamily: true })).toBe(false);
    expect(isToolbarItemVisible("undo", hasExtension, { undo: true })).toBe(false);
    expect(isToolbarItemVisible("embed", hasExtension, { embed: true })).toBe(false);
    expect(isToolbarItemVisible("bold", hasExtension, { bold: true })).toBe(true);
  });

  it("removes empty sections after visibility filtering", () => {
    const hasExtension = createHasExtension([]);

    const filtered = filterToolbarLayout(layout, hasExtension, {
      bold: false,
      italic: false,
      themeToggle: false,
    });

    expect(filtered.sections).toEqual([]);
  });
});
