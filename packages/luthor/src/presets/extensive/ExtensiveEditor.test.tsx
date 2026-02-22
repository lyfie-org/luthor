import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach } from "vitest";
import { vi } from "vitest";

const {
  registerKeyboardShortcutsMock,
  commandsToCommandPaletteItemsMock,
  commandsToSlashCommandItemsMock,
  toolbarMock,
} = vi.hoisted(() => ({
  registerKeyboardShortcutsMock: vi.fn(() => vi.fn()),
  commandsToCommandPaletteItemsMock: vi.fn(() => [{ id: "mock-command" }]),
  commandsToSlashCommandItemsMock: vi.fn(() => [{ id: "mock-slash-command" }]),
  toolbarMock: vi.fn(({ classNames, toolbarStyleVars }: { classNames?: { toolbar?: string }; toolbarStyleVars?: Record<string, string> }) => (
    <div data-testid="toolbar" className={classNames?.toolbar} style={toolbarStyleVars} />
  )),
}));

vi.mock("lexical", () => ({
  $setSelection: vi.fn(),
}));

vi.mock("./extensions", () => ({
  extensiveExtensions: [],
  setFloatingToolbarContext: vi.fn(),
}));

vi.mock("../../core", () => ({
  CommandPalette: () => null,
  SlashCommandMenu: () => null,
  EmojiSuggestionMenu: () => null,
  commandsToCommandPaletteItems: commandsToCommandPaletteItemsMock,
  commandsToSlashCommandItems: commandsToSlashCommandItemsMock,
  formatJSONBSource: (value: string) => value,
  ModeTabs: () => <div data-testid="mode-tabs" />,
  registerKeyboardShortcuts: registerKeyboardShortcutsMock,
  SourceView: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea value={value} onChange={(event) => onChange(event.target.value)} />
  ),
  Toolbar: toolbarMock,
  TRADITIONAL_TOOLBAR_LAYOUT: { sections: [] },
}));

const mockEditorApi = {
  commands: {
    registerCommand: vi.fn(),
    unregisterCommand: vi.fn(),
    registerSlashCommand: vi.fn(),
    unregisterSlashCommand: vi.fn(),
    showCommandPalette: vi.fn(),
    hideCommandPalette: vi.fn(),
    closeSlashMenu: vi.fn(),
    executeSlashCommand: vi.fn(),
    closeEmojiSuggestions: vi.fn(),
    executeEmojiSuggestion: vi.fn(),
  },
  hasExtension: () => false,
  activeStates: {},
  lexical: {
    update: vi.fn(),
    getRootElement: vi.fn(() => null),
    focus: vi.fn(),
    registerUpdateListener: vi.fn(() => () => {}),
  },
  extensions: [],
  export: {
    toJSON: vi.fn(() => ({ root: { children: [] } })),
  },
  import: {
    fromJSON: vi.fn(),
  },
};

vi.mock("@lyfie/luthor-headless", () => ({
  createEditorSystem: () => ({
    Provider: ({ children }: { children: ReactNode }) => <>{children}</>,
    useEditor: () => mockEditorApi,
  }),
  RichText: () => <div data-testid="richtext" />,
}));

import { ExtensiveEditor } from "./ExtensiveEditor";

describe("ExtensiveEditor toolbar placement and alignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders toolbar in the header by default with left alignment", () => {
    const { container } = render(<ExtensiveEditor showDefaultContent={false} />);

    const toolbar = screen.getByTestId("toolbar");
    const header = container.querySelector(".luthor-editor-header");

    expect(toolbar).toHaveClass("luthor-toolbar");
    expect(toolbar).toHaveClass("luthor-toolbar--align-left");
    expect(header).toContainElement(toolbar);
    expect(container.querySelector(".luthor-editor-toolbar-slot--bottom")).toBeNull();
  });

  it("renders toolbar in the bottom slot when toolbarPosition is bottom", () => {
    const { container } = render(<ExtensiveEditor showDefaultContent={false} toolbarPosition="bottom" />);

    const toolbar = screen.getByTestId("toolbar");
    const header = container.querySelector(".luthor-editor-header");
    const bottomSlot = container.querySelector(".luthor-editor-toolbar-slot--bottom");

    expect(header).not.toContainElement(toolbar);
    expect(bottomSlot).toContainElement(toolbar);
  });

  it("applies center and right alignment classes", () => {
    const { rerender } = render(
      <ExtensiveEditor
        showDefaultContent={false}
        toolbarPosition="top"
        toolbarAlignment="center"
      />,
    );

    expect(screen.getByTestId("toolbar")).toHaveClass("luthor-toolbar--align-center");

    rerender(
      <ExtensiveEditor
        showDefaultContent={false}
        toolbarPosition="top"
        toolbarAlignment="right"
      />,
    );

    expect(screen.getByTestId("toolbar")).toHaveClass("luthor-toolbar--align-right");
  });

  it("hides toolbar when isToolbarEnabled is false and keeps command wiring active", () => {
    render(<ExtensiveEditor showDefaultContent={false} isToolbarEnabled={false} />);

    expect(screen.queryByTestId("toolbar")).toBeNull();
    expect(registerKeyboardShortcutsMock).toHaveBeenCalled();
    expect(mockEditorApi.commands.registerCommand).toHaveBeenCalledWith({ id: "mock-command" });
    expect(mockEditorApi.commands.registerSlashCommand).toHaveBeenCalledWith({ id: "mock-slash-command" });
  });

  it("passes toolbarVisibility to toolbar rendering", () => {
    const toolbarVisibility = { bold: false, italic: true };

    render(<ExtensiveEditor showDefaultContent={false} toolbarVisibility={toolbarVisibility} />);

    const toolbarCall = toolbarMock.mock.calls.at(-1)?.[0] as { toolbarVisibility?: unknown };
    expect(toolbarCall.toolbarVisibility).toEqual(toolbarVisibility);
  });

  it("applies toolbarClassName and passes toolbarStyleVars to toolbar rendering", () => {
    const toolbarStyleVars = {
      "--luthor-toolbar-button-active-bg": "#ff4d4f",
      "--luthor-toolbar-button-active-fg": "#ffffff",
    } as const;

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        toolbarClassName="brand-toolbar"
        toolbarStyleVars={toolbarStyleVars}
      />,
    );

    const toolbar = screen.getByTestId("toolbar");
    expect(toolbar).toHaveClass("brand-toolbar");
    expect(toolbar).toHaveStyle({
      "--luthor-toolbar-button-active-bg": "#ff4d4f",
      "--luthor-toolbar-button-active-fg": "#ffffff",
    });
  });
});
