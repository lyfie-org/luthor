/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "./toolbar";
import type { CoreEditorActiveStates, CoreEditorCommands, ToolbarLayout } from "./types";

const BLOCK_FORMAT_LAYOUT: ToolbarLayout = {
  sections: [{ items: ["blockFormat"] }],
};

function createCommands(): CoreEditorCommands {
  return {
    toggleParagraph: vi.fn(),
    toggleHeading: vi.fn(),
  } as unknown as CoreEditorCommands;
}

describe("toolbar block format options", () => {
  it("renders only configured headings and supports custom paragraph label", () => {
    const commands = createCommands();
    const { container } = render(
      <Toolbar
        commands={commands}
        hasExtension={(name) => name === "blockFormat"}
        activeStates={{} as CoreEditorActiveStates}
        isDark={false}
        toggleTheme={() => {}}
        layout={BLOCK_FORMAT_LAYOUT}
        headingOptions={["h2", "h4"]}
        paragraphLabel="Normal"
      />,
    );

    const trigger = container.querySelector(".luthor-select-trigger");
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger as HTMLElement);

    const dropdown = document.querySelector(".luthor-select-dropdown");
    expect(dropdown).not.toBeNull();
    const dropdownQueries = within(dropdown as HTMLElement);
    expect(dropdownQueries.getByRole("button", { name: "Normal" })).toBeInTheDocument();
    expect(dropdownQueries.queryByRole("button", { name: "Heading 1" })).toBeNull();
    expect(dropdownQueries.getByRole("button", { name: "Heading 2" })).toBeInTheDocument();
    expect(dropdownQueries.getByRole("button", { name: "Heading 4" })).toBeInTheDocument();
  });

  it("falls back to paragraph selection when current heading is hidden", () => {
    const commands = createCommands();
    render(
      <Toolbar
        commands={commands}
        hasExtension={(name) => name === "blockFormat"}
        activeStates={{ isH1: true } as CoreEditorActiveStates}
        isDark={false}
        toggleTheme={() => {}}
        layout={BLOCK_FORMAT_LAYOUT}
        headingOptions={["h2"]}
        paragraphLabel="Normal"
      />,
    );

    expect(screen.getByRole("button", { name: /Normal/i })).toBeInTheDocument();
  });
});
