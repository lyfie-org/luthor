/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "./toolbar";
import type {
  CoreEditorActiveStates,
  CoreEditorCommands,
  ToolbarCustomItem,
  ToolbarLayout,
} from "./types";

const LAYOUT: ToolbarLayout = {
  sections: [{ items: ["customComponent"] }],
};

function renderToolbar(customItems?: readonly ToolbarCustomItem[]) {
  return render(
    <Toolbar
      commands={{} as CoreEditorCommands}
      hasExtension={() => true}
      activeStates={{} as CoreEditorActiveStates}
      isDark={false}
      toggleTheme={() => {}}
      layout={LAYOUT}
      customItems={customItems}
    />,
  );
}

describe("toolbar custom items", () => {
  it("renders nothing at customComponent when the host supplies no items", () => {
    const { container } = renderToolbar();
    expect(container.querySelector(".luthor-toolbar-section")).toBeNull();
  });

  it("runs a plain item's onSelect on click", () => {
    const onSelect = vi.fn();
    renderToolbar([{ id: "date", label: "Insert date", icon: <span />, onSelect }]);

    fireEvent.click(screen.getByRole("button", { name: "Insert date" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith();
  });

  it("opens a dropdown for an item with children and runs the chosen child", () => {
    const onYouTube = vi.fn();
    renderToolbar([
      {
        id: "embed",
        label: "Embed",
        icon: <span />,
        items: [
          { id: "yt", label: "YouTube video", icon: <span />, onSelect: onYouTube },
          { id: "web", label: "Web page", icon: <span />, onSelect: vi.fn() },
        ],
      },
    ]);

    expect(screen.queryByRole("button", { name: "YouTube video" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Embed" }));
    fireEvent.click(screen.getByRole("button", { name: "YouTube video" }));

    expect(onYouTube).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Web page" })).toBeNull();
  });

  it("collects a value in the dialog before running an item with input", () => {
    const onSelect = vi.fn();
    renderToolbar([
      {
        id: "web",
        label: "Web page",
        icon: <span />,
        input: { title: "Embed a web page", label: "Page link", submitLabel: "Embed", type: "url" },
        onSelect,
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Web page" }));
    expect(onSelect).not.toHaveBeenCalled();
    // A labelled modal dialog with a named close button.
    const dialog = screen.getByRole("dialog", { name: "Embed a web page" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: "Embed" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Page link"), {
      target: { value: "  https://example.com  " },
    });
    fireEvent.click(submit);

    expect(onSelect).toHaveBeenCalledWith("https://example.com");
    expect(screen.queryByText("Embed a web page")).toBeNull();
  });

  it("cancels the dialog without running the item", () => {
    const onSelect = vi.fn();
    renderToolbar([
      {
        id: "web",
        label: "Web page",
        icon: <span />,
        input: { title: "Embed a web page", label: "Page link" },
        onSelect,
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Web page" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByText("Embed a web page")).toBeNull();
  });
});
