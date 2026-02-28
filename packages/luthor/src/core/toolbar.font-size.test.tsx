import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";
import { Toolbar } from "./toolbar";
import type { CoreEditorActiveStates, CoreEditorCommands, ToolbarLayout } from "./types";

type FontSizeCommandsMock = CoreEditorCommands & {
  getFontSizeOptions: Mock<() => readonly { value: string; label: string; fontSize: string }[]>;
  getCurrentFontSize: Mock<() => Promise<string>>;
  setFontSize: Mock<(value: string) => void>;
  clearFontSize: Mock<() => void>;
};

function createFontSizeCommands(options?: readonly { value: string; label: string; fontSize: string }[]) {
  return {
    getFontSizeOptions: vi.fn(() => options ?? [
      { value: "14", label: "14px", fontSize: "14px" },
      { value: "17", label: "17px", fontSize: "17px" },
    ]),
    getCurrentFontSize: vi.fn(() => Promise.resolve("default")),
    setFontSize: vi.fn(),
    clearFontSize: vi.fn(),
  } as unknown as FontSizeCommandsMock;
}

const FONT_SIZE_ONLY_LAYOUT: ToolbarLayout = {
  sections: [{ items: ["fontSize"] }],
};

const EMPTY_ACTIVE_STATES: CoreEditorActiveStates = {};

describe("toolbar fontSize options", () => {
  it("renders configured font size options in the select list and injects default option when missing", async () => {
    const commands = createFontSizeCommands();
    const { container } = render(
      <Toolbar
        commands={commands}
        hasExtension={(name) => name === "fontSize"}
        activeStates={EMPTY_ACTIVE_STATES}
        isDark={false}
        toggleTheme={() => {}}
        layout={FONT_SIZE_ONLY_LAYOUT}
      />,
    );

    await waitFor(() => {
      expect(commands.getFontSizeOptions).toHaveBeenCalled();
    });

    const trigger = container.querySelector(".luthor-select-trigger");
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger as HTMLElement);

    const dropdown = document.querySelector(".luthor-select-dropdown");
    expect(dropdown).not.toBeNull();

    const dropdownQueries = within(dropdown as HTMLElement);
    expect(dropdownQueries.getByRole("button", { name: "16px" })).toBeInTheDocument();
    expect(dropdownQueries.getByRole("button", { name: "14px" })).toBeInTheDocument();
    expect(dropdownQueries.getByRole("button", { name: "17px" })).toBeInTheDocument();
  });

  it("applies selected font size and clears on default", async () => {
    const commands = createFontSizeCommands([
      { value: "default", label: "Default", fontSize: "inherit" },
      { value: "13", label: "13px", fontSize: "13px" },
      { value: "20", label: "20px", fontSize: "20px" },
    ]);
    const { container } = render(
      <Toolbar
        commands={commands}
        hasExtension={(name) => name === "fontSize"}
        activeStates={EMPTY_ACTIVE_STATES}
        isDark={false}
        toggleTheme={() => {}}
        layout={FONT_SIZE_ONLY_LAYOUT}
      />,
    );

    await waitFor(() => {
      expect(commands.getCurrentFontSize).toHaveBeenCalled();
    });

    const trigger = container.querySelector(".luthor-select-trigger");
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "20px" }));

    expect(commands.setFontSize).toHaveBeenCalledWith("20");
    expect(commands.clearFontSize).not.toHaveBeenCalled();

    fireEvent.click(trigger as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "16px" }));

    expect(commands.clearFontSize).toHaveBeenCalledTimes(1);
  });
});
