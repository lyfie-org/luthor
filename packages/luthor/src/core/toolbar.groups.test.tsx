/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toolbar, isToolbarItemActive } from "./toolbar";
import type { CoreEditorActiveStates, CoreEditorCommands, ToolbarLayout } from "./types";

const LAYOUT: ToolbarLayout = {
  sections: [
    { items: ["bold", "italic", "strikethrough"], group: { id: "style", label: "Text style" } },
    { items: ["link"] },
  ],
};

function renderToolbar(activeStates: CoreEditorActiveStates = {}) {
  const commands = {
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleStrikethrough: vi.fn(),
    insertLink: vi.fn(),
    removeLink: vi.fn(),
  } as unknown as CoreEditorCommands;
  render(
    <Toolbar
      commands={commands}
      hasExtension={() => true}
      activeStates={activeStates}
      isDark={false}
      toggleTheme={() => {}}
      layout={LAYOUT}
    />,
  );
  return commands;
}

describe("toolbar groups", () => {
  it("collapses a grouped section behind one button and keeps the rest inline", () => {
    renderToolbar();
    expect(screen.getByRole("button", { name: "Text style" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bold/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Insert Link/ })).toBeInTheDocument();
  });

  it("opens the group's items, which act as usual", () => {
    const commands = renderToolbar();
    const trigger = screen.getByRole("button", { name: "Text style" });
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Bold/ }));
    expect(commands.toggleBold).toHaveBeenCalled();
  });

  it("closes on a click outside and on Escape", () => {
    renderToolbar();
    const trigger = screen.getByRole("button", { name: "Text style" });
    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("button", { name: /Bold/ })).toBeNull();

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: /Bold/ })).toBeNull();
  });

  it("closes on an outside click even when the host stops it from bubbling", () => {
    renderToolbar();
    // A host modal that keeps clicks inside itself (stopPropagation on
    // mousedown) must not leave the group stuck open.
    const host = document.createElement("div");
    host.addEventListener("mousedown", (event) => event.stopPropagation());
    document.body.appendChild(host);
    try {
      fireEvent.click(screen.getByRole("button", { name: "Text style" }));
      fireEvent.mouseDown(host);
      expect(screen.queryByRole("button", { name: /Bold/ })).toBeNull();
    } finally {
      host.remove();
    }
  });

  it("lights the group button while an item inside is active", () => {
    renderToolbar({ italic: true });
    expect(screen.getByRole("button", { name: "Text style" }).className).toContain("active");
  });

  it("maps items to their active state", () => {
    expect(isToolbarItemActive("bold", { bold: true })).toBe(true);
    expect(isToolbarItemActive("link", { isLink: true })).toBe(true);
    expect(isToolbarItemActive("codeBlock", { isInCodeBlock: true })).toBe(true);
    expect(isToolbarItemActive("table", { bold: true })).toBe(false);
  });

  it("keeps the group open while a menu inside it is used", () => {
    const onYouTube = vi.fn();
    render(
      <Toolbar
        commands={{} as CoreEditorCommands}
        hasExtension={() => true}
        activeStates={{}}
        isDark={false}
        toggleTheme={() => {}}
        layout={{ sections: [{ items: ["customComponent"], group: { id: "insert", label: "Insert" } }] }}
        customItems={[
          {
            id: "embed",
            label: "Embed",
            icon: <span />,
            items: [{ id: "yt", label: "YouTube video", icon: <span />, onSelect: onYouTube }],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));
    fireEvent.click(screen.getByRole("button", { name: "Embed" }));
    const child = screen.getByRole("button", { name: "YouTube video" });
    // A real click starts with mousedown — inside the child menu's portal,
    // which must not count as "outside" the group.
    fireEvent.mouseDown(child);
    fireEvent.click(child);
    expect(onYouTube).toHaveBeenCalled();
  });
});
