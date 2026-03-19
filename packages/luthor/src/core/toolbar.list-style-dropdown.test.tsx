import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "./toolbar";
import type { CoreEditorCommands } from "./types";

function createCommands() {
  const toggleUnorderedList = vi.fn();
  const toggleOrderedList = vi.fn();
  const toggleCheckList = vi.fn();

  return {
    api: {
      toggleUnorderedList,
      toggleOrderedList,
      toggleCheckList,
    } as unknown as CoreEditorCommands,
    spies: {
      toggleUnorderedList,
      toggleOrderedList,
      toggleCheckList,
    },
  };
}

describe("toolbar list style dropdown controls", () => {
  it("shows list style arrow controls by default", () => {
    const commands = createCommands();
    const { container } = render(
      <Toolbar
        commands={commands.api}
        hasExtension={(name) => name === "list"}
        activeStates={{}}
        isDark={false}
        toggleTheme={() => {}}
        layout={{
          sections: [{ items: ["unorderedList", "orderedList", "checkList"] }],
        }}
      />,
    );

    expect(container.querySelectorAll(".luthor-toolbar-button-arrow")).toHaveLength(3);
  });

  it("hides list style arrow controls and keeps default list toggles active", () => {
    const commands = createCommands();
    const { container } = render(
      <Toolbar
        commands={commands.api}
        hasExtension={(name) => name === "list"}
        activeStates={{}}
        isDark={false}
        toggleTheme={() => {}}
        isListStyleDropdownEnabled={false}
        layout={{
          sections: [{ items: ["unorderedList", "orderedList", "checkList"] }],
        }}
      />,
    );

    expect(container.querySelector(".luthor-toolbar-button-arrow")).toBeNull();
    expect(screen.queryByTitle("Bullet List Styles")).toBeNull();
    expect(screen.queryByTitle("Numbered List Styles")).toBeNull();
    expect(screen.queryByTitle("Checklist Styles")).toBeNull();

    fireEvent.click(screen.getByTitle("Bullet List"));
    fireEvent.click(screen.getByTitle("Numbered List"));
    fireEvent.click(screen.getByTitle("Checklist"));

    expect(commands.spies.toggleUnorderedList).toHaveBeenCalledTimes(1);
    expect(commands.spies.toggleOrderedList).toHaveBeenCalledTimes(1);
    expect(commands.spies.toggleCheckList).toHaveBeenCalledTimes(1);
  });
});
