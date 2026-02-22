import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

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
  commandsToCommandPaletteItems: () => [],
  commandsToSlashCommandItems: () => [],
  formatJSONBSource: (value: string) => value,
  ModeTabs: () => <div data-testid="mode-tabs" />,
  registerKeyboardShortcuts: () => () => {},
  SourceView: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea value={value} onChange={(event) => onChange(event.target.value)} />
  ),
  Toolbar: ({ classNames }: { classNames?: { toolbar?: string } }) => (
    <div data-testid="toolbar" className={classNames?.toolbar} />
  ),
  TRADITIONAL_TOOLBAR_LAYOUT: { sections: [] },
}));

const mockEditorApi = {
  commands: {
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
});
