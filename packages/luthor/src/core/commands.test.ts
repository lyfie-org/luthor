import { describe, expect, it, vi } from "vitest";
import {
  commandsToCommandPaletteItems,
  commandsToSlashCommandItems,
  generateCommands,
  registerKeyboardShortcuts,
} from "./commands";
import type { CoreEditorCommands } from "./types";

function createCommands(): CoreEditorCommands {
  return {
    toggleParagraph: vi.fn(),
    toggleHeading: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrikethrough: vi.fn(),
    formatText: vi.fn(),
    insertLink: vi.fn(),
    removeLink: vi.fn(),
    toggleQuote: vi.fn(),
    setTextAlignment: vi.fn(),
    toggleCodeBlock: vi.fn(),
    toggleUnorderedList: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleCheckList: vi.fn(),
    indentList: vi.fn(),
    outdentList: vi.fn(),
    insertHorizontalRule: vi.fn(),
    insertTable: vi.fn(),
    insertImage: vi.fn(),
    setImageAlignment: vi.fn(),
    setImageCaption: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    showCommandPalette: vi.fn(),
    hideCommandPalette: vi.fn(),
    registerCommand: vi.fn(),
    unregisterCommand: vi.fn(),
  } as unknown as CoreEditorCommands;
}

describe("command heading configuration", () => {
  it("filters generated heading commands and renames paragraph label", () => {
    const commands = generateCommands({
      headingOptions: ["h2", "h5"],
      paragraphLabel: "Normal",
    });

    expect(commands.find((command) => command.id === "block.paragraph")?.label).toBe("Normal");
    expect(commands.some((command) => command.id === "block.heading2")).toBe(true);
    expect(commands.some((command) => command.id === "block.heading5")).toBe(true);
    expect(commands.some((command) => command.id === "block.heading1")).toBe(false);
  });

  it("applies heading filtering to command palette and slash command items", () => {
    const commands = createCommands();

    const palette = commandsToCommandPaletteItems(commands, { headingOptions: ["h3"] });
    const slash = commandsToSlashCommandItems(commands, { headingOptions: ["h3"] });

    expect(palette.some((command) => command.id === "block.heading3")).toBe(true);
    expect(palette.some((command) => command.id === "block.heading2")).toBe(false);
    expect(slash.some((command) => command.id === "block.heading3")).toBe(true);
    expect(slash.some((command) => command.id === "block.heading1")).toBe(false);
  });

  it("registers keyboard shortcuts only for enabled headings", () => {
    const commands = createCommands();
    const toggleHeading = commands.toggleHeading as unknown as ReturnType<typeof vi.fn>;
    const host = document.createElement("div");
    const teardown = registerKeyboardShortcuts(
      commands,
      host,
      { headingOptions: ["h2"] },
    );

    const h2Event = new KeyboardEvent("keydown", {
      key: "2",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    host.dispatchEvent(h2Event);
    expect(toggleHeading).toHaveBeenCalledWith("h2");

    toggleHeading.mockClear();
    const h1Event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    host.dispatchEvent(h1Event);
    expect(toggleHeading).not.toHaveBeenCalled();

    teardown();
  });

  it("applies slash command allowlist and denylist filtering", () => {
    const commands = createCommands();

    const slash = commandsToSlashCommandItems(commands, {
      slashCommandVisibility: {
        allowlist: ["insert.table", "block.heading2", "insert.image"],
        denylist: ["insert.image"],
      },
    });

    expect(slash.map((command) => command.id)).toEqual(["block.heading2", "insert.table"]);
  });

  it("keeps slash command order deterministic when filtering", () => {
    const commands = createCommands();

    const slash = commandsToSlashCommandItems(commands, {
      slashCommandVisibility: {
        allowlist: ["insert.table", "block.heading1", "block.quote"],
      },
    });

    expect(slash.map((command) => command.id)).toEqual([
      "block.heading1",
      "block.quote",
      "insert.table",
    ]);
  });

  it("supports slash command visibility as an enabled-id selection list", () => {
    const commands = createCommands();

    const slash = commandsToSlashCommandItems(commands, {
      slashCommandVisibility: [
        { "block.quote": true },
        { "block.paragraph": true },
        { "block.heading1": true },
        { "insert.image": false },
      ],
    });

    expect(slash.map((command) => command.id)).toEqual([
      "block.paragraph",
      "block.heading1",
      "block.quote",
    ]);
  });

  it("filters command palette and slash commands when features are disabled", () => {
    const commands = createCommands();
    const isFeatureEnabled = (feature: string) => feature !== "image" && feature !== "blockFormat";

    const palette = commandsToCommandPaletteItems(commands, { isFeatureEnabled });
    const slash = commandsToSlashCommandItems(commands, { isFeatureEnabled });

    expect(palette.some((command) => command.id === "insert.image")).toBe(false);
    expect(palette.some((command) => command.id === "block.quote")).toBe(false);
    expect(slash.some((command) => command.id === "insert.image")).toBe(false);
    expect(slash.some((command) => command.id === "block.quote")).toBe(false);
  });

  it("includes commands without keyboard shortcuts in command palette by default", () => {
    const commands = createCommands();
    const palette = commandsToCommandPaletteItems(commands);

    expect(palette.some((command) => command.id === "insert.image")).toBe(true);
    expect(palette.some((command) => command.id === "block.quote")).toBe(true);
  });

  it("can limit command palette to commands with keyboard shortcuts", () => {
    const commands = createCommands();
    const palette = commandsToCommandPaletteItems(commands, {
      commandPaletteShortcutOnly: true,
    });

    expect(palette.every((command) => typeof command.shortcut === "string" && command.shortcut.length > 0)).toBe(true);
    expect(palette.some((command) => command.id === "insert.image")).toBe(false);
    expect(palette.some((command) => command.id === "block.quote")).toBe(false);
  });

  it("supports per-command shortcut remap and disable", () => {
    const commands = createCommands();
    const toggleBold = commands.toggleBold as unknown as ReturnType<typeof vi.fn>;
    const toggleItalic = commands.toggleItalic as unknown as ReturnType<typeof vi.fn>;
    const host = document.createElement("div");
    const teardown = registerKeyboardShortcuts(commands, host, {
      shortcutConfig: {
        bindings: {
          "format.bold": { key: "m", ctrlKey: true },
          "format.italic": false,
        },
      },
    });

    host.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "m",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(toggleBold).toHaveBeenCalledTimes(1);

    host.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "i",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(toggleItalic).not.toHaveBeenCalled();

    teardown();
  });

  it("removes disabled commands from command palette and slash commands", () => {
    const commands = createCommands();
    const palette = commandsToCommandPaletteItems(commands, {
      shortcutConfig: {
        disabledCommandIds: ["format.bold", "insert.table"],
      },
    });
    const slash = commandsToSlashCommandItems(commands, {
      shortcutConfig: {
        disabledCommandIds: ["format.bold", "insert.table"],
      },
    });

    expect(palette.some((command) => command.id === "format.bold")).toBe(false);
    expect(slash.some((command) => command.id === "insert.table")).toBe(false);
  });

  it("filters duplicate shortcuts across commands by default", () => {
    const commands = createCommands();

    const palette = commandsToCommandPaletteItems(commands, {
      shortcutConfig: {
        bindings: {
          "format.bold": { key: "m", ctrlKey: true },
          "format.italic": { key: "m", ctrlKey: true },
        },
      },
    });

    const boldCommand = palette.find((command) => command.id === "format.bold");
    const italicCommand = palette.find((command) => command.id === "format.italic");
    expect(boldCommand?.shortcut).toBe("Ctrl+M");
    expect(italicCommand?.shortcut).toBeUndefined();
  });

  it("prevents native editable shortcut conflicts by default but allows opt-out", () => {
    const commands = createCommands();
    const toggleBold = commands.toggleBold as unknown as ReturnType<typeof vi.fn>;
    const undo = commands.undo as unknown as ReturnType<typeof vi.fn>;
    const host = document.createElement("div");
    host.setAttribute("contenteditable", "true");
    const child = document.createElement("span");
    host.appendChild(child);

    const teardownDefault = registerKeyboardShortcuts(commands, host);
    child.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(toggleBold).not.toHaveBeenCalled();

    child.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(undo).toHaveBeenCalledTimes(1);
    teardownDefault();

    const teardownOptOut = registerKeyboardShortcuts(commands, host, {
      shortcutConfig: {
        preventNativeConflicts: false,
      },
    });
    child.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(toggleBold).toHaveBeenCalledTimes(1);
    teardownOptOut();
  });

  it("scopes shortcut handlers to a specific editor root", () => {
    const firstCommands = createCommands();
    const secondCommands = createCommands();
    const firstBold = firstCommands.toggleBold as unknown as ReturnType<typeof vi.fn>;
    const secondBold = secondCommands.toggleBold as unknown as ReturnType<typeof vi.fn>;

    const firstRoot = document.createElement("div");
    const secondRoot = document.createElement("div");
    const firstChild = document.createElement("span");
    const secondChild = document.createElement("span");
    firstRoot.appendChild(firstChild);
    secondRoot.appendChild(secondChild);
    document.body.appendChild(firstRoot);
    document.body.appendChild(secondRoot);

    const teardownFirst = registerKeyboardShortcuts(firstCommands, document.body, {
      scope: firstRoot,
      shortcutConfig: {
        bindings: {
          "format.bold": { key: "m", ctrlKey: true },
        },
      },
    });
    const teardownSecond = registerKeyboardShortcuts(secondCommands, document.body, {
      scope: secondRoot,
      shortcutConfig: {
        bindings: {
          "format.bold": { key: "m", ctrlKey: true },
        },
      },
    });

    firstChild.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "m",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(firstBold).toHaveBeenCalledTimes(1);
    expect(secondBold).not.toHaveBeenCalled();

    teardownFirst();
    teardownSecond();
    firstRoot.remove();
    secondRoot.remove();
  });
});
