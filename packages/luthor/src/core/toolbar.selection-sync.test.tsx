import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";
import { Toolbar } from "./toolbar";
import type { CoreEditorActiveStates, CoreEditorCommands, ToolbarLayout } from "./types";

type FontFamilyCommandsMock = CoreEditorCommands & {
  getFontFamilyOptions: Mock<
    () => readonly { value: string; label: string; fontFamily: string }[]
  >;
  getCurrentFontFamily: Mock<() => Promise<string>>;
};

const FONT_FAMILY_ONLY_LAYOUT: ToolbarLayout = {
  sections: [{ items: ["fontFamily"] }],
};

const EMPTY_ACTIVE_STATES: CoreEditorActiveStates = {};

function createFontFamilyCommands(): FontFamilyCommandsMock {
  return {
    getFontFamilyOptions: vi.fn(() => [
      { value: "default", label: "Default", fontFamily: "inherit" },
      { value: "serif", label: "Serif", fontFamily: "Times New Roman, serif" },
      { value: "mono", label: "Mono", fontFamily: "Courier New, monospace" },
    ]),
    getCurrentFontFamily: vi.fn(() => Promise.resolve("default")),
  } as unknown as FontFamilyCommandsMock;
}

describe("toolbar selection sync", () => {
  it("refreshes font family on collapsed cursor move within the same line", async () => {
    const host = document.createElement("div");
    host.className = "luthor-content-editable";

    const first = document.createElement("span");
    first.style.fontFamily = "Times New Roman";
    first.textContent = "First";

    const spacer = document.createTextNode(" ");

    const last = document.createElement("span");
    last.style.fontFamily = "Courier New";
    last.textContent = "Last";

    host.append(first, spacer, last);
    document.body.append(host);

    let anchorNode: Node | null = first.firstChild;
    const getSelectionSpy = vi
      .spyOn(window, "getSelection")
      .mockImplementation(() => ({
        anchorNode,
        rangeCount: 1,
        getRangeAt: () => ({ collapsed: true }),
      }) as unknown as Selection);

    const commands = createFontFamilyCommands();
    const { container, unmount } = render(
      <Toolbar
        commands={commands}
        hasExtension={(name) => name === "fontFamily"}
        activeStates={EMPTY_ACTIVE_STATES}
        isDark={false}
        toggleTheme={() => {}}
        layout={FONT_FAMILY_ONLY_LAYOUT}
      />,
    );

    const triggerText = () =>
      container.querySelector(".luthor-select-trigger span")?.textContent;

    await waitFor(() => {
      expect(triggerText()).toBe("Serif");
    });

    anchorNode = last.firstChild;
    fireEvent(document, new Event("selectionchange"));

    await waitFor(() => {
      expect(triggerText()).toBe("Mono");
    });

    unmount();
    getSelectionSpy.mockRestore();
    host.remove();
  });
});
