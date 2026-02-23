import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach } from "vitest";
import { vi } from "vitest";

const {
  registerKeyboardShortcutsMock,
  commandsToCommandPaletteItemsMock,
  commandsToSlashCommandItemsMock,
  commandPaletteMock,
  toolbarMock,
  createExtensiveExtensionsMock,
  createEditorThemeStyleVarsMock,
  providerMock,
  richTextMock,
  sourceViewMock,
} = vi.hoisted(() => ({
  registerKeyboardShortcutsMock: vi.fn(() => vi.fn()),
  commandsToCommandPaletteItemsMock: vi.fn(() => [{ id: "mock-command" }]),
  commandsToSlashCommandItemsMock: vi.fn(() => [{ id: "mock-slash-command" }]),
  commandPaletteMock: vi.fn(() => null),
  toolbarMock: vi.fn(({ classNames, toolbarStyleVars }: { classNames?: { toolbar?: string }; toolbarStyleVars?: Record<string, string> }) => (
    <div data-testid="toolbar" className={classNames?.toolbar} style={toolbarStyleVars} />
  )),
  createExtensiveExtensionsMock: vi.fn(() => []),
  createEditorThemeStyleVarsMock: vi.fn((overrides?: Record<string, string>) => overrides),
  providerMock: vi.fn(),
  richTextMock: vi.fn(({ placeholder, classNames }: { placeholder?: string; classNames?: { placeholder?: string } }) => (
    <div data-testid="richtext" data-placeholder-class={classNames?.placeholder}>{placeholder}</div>
  )),
  sourceViewMock: vi.fn(
    ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => (
      <textarea data-testid="source-view" data-placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    ),
  ),
}));

vi.mock("lexical", () => ({
  $setSelection: vi.fn(),
}));

vi.mock("./extensions", () => ({
  extensiveExtensions: [],
  createExtensiveExtensions: createExtensiveExtensionsMock,
  setFloatingToolbarContext: vi.fn(),
  resolveFeatureFlags: vi.fn((featureFlags) => ({
    bold: true,
    italic: true,
    underline: true,
    strikethrough: true,
    fontFamily: true,
    fontSize: true,
    lineHeight: true,
    textColor: true,
    textHighlight: true,
    subscript: true,
    superscript: true,
    link: true,
    horizontalRule: true,
    table: true,
    list: true,
    history: true,
    image: true,
    blockFormat: true,
    code: true,
    codeIntelligence: true,
    codeFormat: true,
    tabIndent: true,
    enterKeyBehavior: true,
    iframeEmbed: true,
    youTubeEmbed: true,
    floatingToolbar: true,
    contextMenu: true,
    commandPalette: true,
    slashCommand: true,
    emoji: true,
    draggableBlock: true,
    customNode: true,
    themeToggle: true,
    ...(featureFlags ?? {}),
  })),
  EXTENSIVE_FEATURE_KEYS: [
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "fontFamily",
    "fontSize",
    "lineHeight",
    "textColor",
    "textHighlight",
    "subscript",
    "superscript",
    "link",
    "horizontalRule",
    "table",
    "list",
    "history",
    "image",
    "blockFormat",
    "code",
    "codeIntelligence",
    "codeFormat",
    "tabIndent",
    "enterKeyBehavior",
    "iframeEmbed",
    "youTubeEmbed",
    "floatingToolbar",
    "contextMenu",
    "commandPalette",
    "slashCommand",
    "emoji",
    "draggableBlock",
    "customNode",
    "themeToggle",
  ],
}));

vi.mock("../../core", () => ({
  CommandPalette: commandPaletteMock,
  SlashCommandMenu: () => null,
  EmojiSuggestionMenu: () => null,
  commandsToCommandPaletteItems: commandsToCommandPaletteItemsMock,
  commandsToSlashCommandItems: commandsToSlashCommandItemsMock,
  formatJSONBSource: (value: string) => value,
  ModeTabs: () => <div data-testid="mode-tabs" />,
  registerKeyboardShortcuts: registerKeyboardShortcutsMock,
  generateCommands: vi.fn(() => [
    { id: "format.bold", shortcuts: [{ key: "b", ctrlKey: true }] },
    { id: "format.italic", shortcuts: [{ key: "i", ctrlKey: true }] },
    { id: "insert.table", shortcuts: [] },
  ]),
  SourceView: sourceViewMock,
  LinkHoverBubble: () => null,
  Toolbar: toolbarMock,
  TRADITIONAL_TOOLBAR_LAYOUT: { sections: [] },
  BLOCK_HEADING_LEVELS: ["h1", "h2", "h3", "h4", "h5", "h6"],
}));

const mockEditorApi = {
  commands: {
    registerCommand: vi.fn(),
    unregisterCommand: vi.fn(),
    registerSlashCommand: vi.fn(),
    unregisterSlashCommand: vi.fn(),
    setSlashCommands: vi.fn(),
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
    Provider: ({ children, config }: { children: ReactNode; config?: unknown }) => {
      providerMock(config);
      return <>{children}</>;
    },
    useEditor: () => mockEditorApi,
  }),
  RichText: richTextMock,
  defaultLuthorTheme: { quote: "luthor-quote" },
  mergeThemes: (_base: unknown, override: Record<string, unknown>) => ({
    quote: "luthor-quote",
    ...override,
  }),
  createEditorThemeStyleVars: createEditorThemeStyleVarsMock,
  clearLexicalSelection: vi.fn(),
}));

import { ExtensiveEditor } from "./ExtensiveEditor";

describe("ExtensiveEditor toolbar placement and alignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditorApi.extensions = [];
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
    expect(mockEditorApi.commands.setSlashCommands).toHaveBeenCalledWith([{ id: "mock-slash-command" }]);
  });

  it("passes toolbarVisibility to toolbar rendering", () => {
    const toolbarVisibility = { bold: false, italic: true };

    render(<ExtensiveEditor showDefaultContent={false} toolbarVisibility={toolbarVisibility} />);

    const toolbarCall = toolbarMock.mock.calls.at(-1)?.[0] as { toolbarVisibility?: unknown };
    expect(toolbarCall.toolbarVisibility).toEqual(toolbarVisibility);
  });

  it("passes headingOptions and paragraphLabel to toolbar and command wiring by default", () => {
    const headingOptions = ["h2", "h4"] as const;

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        headingOptions={headingOptions}
        paragraphLabel="Normal"
      />,
    );

    const toolbarCall = toolbarMock.mock.calls.at(-1)?.[0] as {
      headingOptions?: unknown;
      paragraphLabel?: unknown;
    };
    expect(toolbarCall.headingOptions).toEqual(headingOptions);
    expect(toolbarCall.paragraphLabel).toBe("Normal");

    expect(commandsToCommandPaletteItemsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headingOptions, paragraphLabel: "Normal" }),
    );
    expect(commandsToSlashCommandItemsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headingOptions, paragraphLabel: "Normal", slashCommandVisibility: undefined }),
    );
    expect(registerKeyboardShortcutsMock).toHaveBeenCalledWith(
      expect.anything(),
      document.body,
      expect.objectContaining({ headingOptions, paragraphLabel: "Normal" }),
    );
  });

  it("can keep heading commands independent from toolbar options", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        headingOptions={["h6"]}
        syncHeadingOptionsWithCommands={false}
      />,
    );

    expect(commandsToCommandPaletteItemsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headingOptions: undefined, paragraphLabel: undefined }),
    );
    expect(commandsToSlashCommandItemsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headingOptions: undefined, paragraphLabel: undefined, slashCommandVisibility: undefined }),
    );
    expect(registerKeyboardShortcutsMock).toHaveBeenCalledWith(
      expect.anything(),
      document.body,
      expect.objectContaining({ headingOptions: undefined, paragraphLabel: undefined }),
    );
  });

  it("passes slashCommandVisibility to slash command mapping and replaces command list on updates", () => {
    commandsToSlashCommandItemsMock
      .mockReturnValueOnce([{ id: "insert.table" }])
      .mockReturnValueOnce([{ id: "insert.image" }]);

    const { rerender } = render(
      <ExtensiveEditor
        showDefaultContent={false}
        slashCommandVisibility={{ allowlist: ["insert.table"] }}
      />,
    );

    expect(commandsToSlashCommandItemsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headingOptions: expect.anything(),
        paragraphLabel: undefined,
        slashCommandVisibility: { allowlist: ["insert.table"] },
      }),
    );
    expect(mockEditorApi.commands.setSlashCommands).toHaveBeenCalledWith([{ id: "insert.table" }]);

    rerender(
      <ExtensiveEditor
        showDefaultContent={false}
        slashCommandVisibility={{ allowlist: ["insert.image"] }}
      />,
    );

    expect(mockEditorApi.commands.setSlashCommands).toHaveBeenCalledWith([]);
    expect(mockEditorApi.commands.setSlashCommands).toHaveBeenCalledWith([{ id: "insert.image" }]);
  });

  it("passes shortcutConfig through command mapping and keyboard registration", () => {
    const shortcutConfig = {
      disabledCommandIds: ["format.italic"],
      bindings: {
        "format.bold": { key: "m", ctrlKey: true },
      },
    } as const;

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        shortcutConfig={shortcutConfig}
      />,
    );

    expect(commandsToCommandPaletteItemsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ shortcutConfig }),
    );
    expect(commandsToSlashCommandItemsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ shortcutConfig }),
    );
    expect(registerKeyboardShortcutsMock).toHaveBeenCalledWith(
      expect.anything(),
      document.body,
      expect.objectContaining({ shortcutConfig, scope: expect.any(Function) }),
    );
  });

  it("filters command palette extension items without shortcuts when commandPaletteShortcutOnly is enabled", () => {
    const subscribe = vi.fn((listener: (isOpen: boolean, items: Array<{ id: string; shortcut?: string }>) => void) => {
      listener(true, [
        { id: "table.insertRowAbove" },
        { id: "format.bold", shortcut: "Ctrl+M" },
      ]);
      return () => {};
    });
    mockEditorApi.extensions = [{ name: "commandPalette", subscribe }] as any;

    render(<ExtensiveEditor showDefaultContent={false} commandPaletteShortcutOnly />);

    const lastCall = commandPaletteMock.mock.calls.at(-1)?.[0] as { commands?: Array<{ id: string }> };
    expect(lastCall.commands).toEqual([{ id: "format.bold", shortcut: "Ctrl+M" }]);
  });

  it("keeps command palette extension items without shortcuts by default", () => {
    const subscribe = vi.fn((listener: (isOpen: boolean, items: Array<{ id: string; shortcut?: string }>) => void) => {
      listener(true, [
        { id: "table.insertRowAbove" },
        { id: "format.bold", shortcut: "Ctrl+M" },
      ]);
      return () => {};
    });
    mockEditorApi.extensions = [{ name: "commandPalette", subscribe }] as any;

    render(<ExtensiveEditor showDefaultContent={false} />);

    const lastCall = commandPaletteMock.mock.calls.at(-1)?.[0] as { commands?: Array<{ id: string }> };
    expect(lastCall.commands).toEqual([
      { id: "table.insertRowAbove" },
      { id: "format.bold", shortcut: "Ctrl+M" },
    ]);
  });

  it("blocks default lexical shortcut when command is disabled via disabledCommandIds", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        shortcutConfig={{ disabledCommandIds: ["format.bold"] }}
      />,
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    input.remove();
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

  it("passes fontFamilyOptions to extension factory", () => {
    const fontFamilyOptions = [
      { value: "default", label: "Default", fontFamily: "inherit" },
      { value: "geist", label: "Geist", fontFamily: "'Geist', Arial, sans-serif" },
    ] as const;

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        fontFamilyOptions={fontFamilyOptions}
      />,
    );

    expect(createExtensiveExtensionsMock).toHaveBeenCalledWith(expect.objectContaining({
      fontFamilyOptions,
      fontSizeOptions: undefined,
      lineHeightOptions: undefined,
      scaleByRatio: false,
      isCopyAllowed: true,
    }));
  });

  it("applies quoteClassName through editor theme config", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        quoteClassName="brand-quote"
      />,
    );

    const providerConfig = providerMock.mock.calls.at(-1)?.[0] as { theme?: { quote?: string } };
    expect(providerConfig.theme?.quote).toBe("luthor-quote brand-quote");
  });

  it("merges theme quote override with quoteClassName", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        theme={{ quote: "custom-quote" }}
        quoteClassName="brand-quote"
      />,
    );

    const providerConfig = providerMock.mock.calls.at(-1)?.[0] as { theme?: { quote?: string } };
    expect(providerConfig.theme?.quote).toBe("custom-quote brand-quote");
  });

  it("applies quoteStyleVars on editor wrapper", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        quoteStyleVars={{
          "--luthor-quote-bg": "#fef3c7",
          "--luthor-quote-fg": "#78350f",
          "--luthor-quote-border": "#d97706",
        }}
      />,
    );

    const wrapper = document.querySelector(".luthor-editor-wrapper");
    expect(wrapper).toHaveStyle({
      "--luthor-quote-bg": "#fef3c7",
      "--luthor-quote-fg": "#78350f",
      "--luthor-quote-border": "#d97706",
    });
  });

  it("applies defaultSettings tokens on editor wrapper", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        defaultSettings={{
          font: { color: "#111827", boldColor: "#0f172a" },
          link: { color: "#1d4ed8" },
          list: { markerColor: "#1f2937", checkboxColor: "#2563eb" },
          quote: {
            backgroundColor: "#f8fafc",
            color: "#334155",
            indicatorColor: "#2563eb",
          },
          table: { borderColor: "#cbd5e1", headerBackgroundColor: "#f1f5f9" },
          hr: { color: "#cbd5e1" },
          placeholder: { color: "#94a3b8" },
          codeblock: { backgroundColor: "#f8fafc" },
          toolbar: { backgroundColor: "#f8fafc" },
        }}
      />,
    );

    const wrapper = document.querySelector(".luthor-editor-wrapper");
    expect(wrapper).toHaveStyle({
      "--luthor-fg": "#111827",
      "--luthor-text-bold-color": "#0f172a",
      "--luthor-link-color": "#1d4ed8",
      "--luthor-list-marker-color": "#1f2937",
      "--luthor-list-checkbox-color": "#2563eb",
      "--luthor-quote-bg": "#f8fafc",
      "--luthor-quote-fg": "#334155",
      "--luthor-quote-border": "#2563eb",
      "--luthor-table-border-color": "#cbd5e1",
      "--luthor-table-header-bg": "#f1f5f9",
      "--luthor-hr-color": "#cbd5e1",
      "--luthor-placeholder-color": "#94a3b8",
      "--luthor-codeblock-bg": "#f8fafc",
      "--luthor-toolbar-bg": "#f8fafc",
    });
  });

  it("applies minimumDefaultLineHeight as editor baseline CSS variable", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        minimumDefaultLineHeight={1.2}
      />,
    );

    const wrapper = document.querySelector(".luthor-editor-wrapper");
    expect(wrapper).toHaveStyle({
      "--luthor-default-line-height": "1.2",
    });
  });

  it("prioritizes editorThemeOverrides over defaultSettings for overlapping tokens", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        defaultSettings={{
          font: { color: "#111827" },
          quote: { indicatorColor: "#2563eb" },
        }}
        editorThemeOverrides={{
          "--luthor-fg": "#14532d",
          "--luthor-quote-border": "#16a34a",
        }}
      />,
    );

    const wrapper = document.querySelector(".luthor-editor-wrapper");
    expect(wrapper).toHaveStyle({
      "--luthor-fg": "#14532d",
      "--luthor-quote-border": "#16a34a",
    });
  });

  it("passes fontSizeOptions to extension factory", () => {
    const fontSizeOptions = [
      { value: "default", label: "Default", fontSize: "inherit" },
      { value: "13", label: "13px", fontSize: "13px" },
      { value: "17", label: "17px", fontSize: "17px" },
    ] as const;

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        fontSizeOptions={fontSizeOptions}
      />,
    );

    expect(createExtensiveExtensionsMock).toHaveBeenCalledWith(expect.objectContaining({
      fontFamilyOptions: undefined,
      fontSizeOptions,
      lineHeightOptions: undefined,
      scaleByRatio: false,
      isCopyAllowed: true,
    }));
  });

  it("passes lineHeightOptions to extension factory", () => {
    const lineHeightOptions = [
      { value: "default", label: "Default", lineHeight: "normal" },
      { value: "1.3", label: "1.3", lineHeight: "1.3" },
      { value: "1.8", label: "1.8", lineHeight: "1.8" },
    ] as const;

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        lineHeightOptions={lineHeightOptions}
      />,
    );

    expect(createExtensiveExtensionsMock).toHaveBeenCalledWith(expect.objectContaining({
      fontFamilyOptions: undefined,
      fontSizeOptions: undefined,
      lineHeightOptions,
      minimumDefaultLineHeight: 1.5,
      scaleByRatio: false,
      isCopyAllowed: true,
    }));
  });

  it("passes minimumDefaultLineHeight to extension factory", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        minimumDefaultLineHeight={1.2}
      />,
    );

    expect(createExtensiveExtensionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        minimumDefaultLineHeight: 1.2,
      }),
    );
  });

  it("passes code language options to extension factory", () => {
    const languageOptions = {
      mode: "replace",
      values: ["typescript", "javascript", "sql"],
    } as const;

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        languageOptions={languageOptions}
      />,
    );

    expect(createExtensiveExtensionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        languageOptions,
      }),
    );
  });

  it("passes scaleByRatio to extension factory", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        scaleByRatio
      />,
    );

    expect(createExtensiveExtensionsMock).toHaveBeenCalledWith(expect.objectContaining({
      fontFamilyOptions: undefined,
      fontSizeOptions: undefined,
      lineHeightOptions: undefined,
      scaleByRatio: true,
      isCopyAllowed: true,
    }));
  });

  it("disables draggable block extension and gutter affordances when isDraggableBoxEnabled is false", () => {
    const { container } = render(
      <ExtensiveEditor
        showDefaultContent={false}
        isDraggableBoxEnabled={false}
      />,
    );

    const lastCall = createExtensiveExtensionsMock.mock.calls.at(-1)?.[0] as {
      isDraggableBoxEnabled?: boolean;
      featureFlags?: { draggableBlock?: boolean };
    };

    expect(lastCall.isDraggableBoxEnabled).toBe(false);
    expect(lastCall.featureFlags?.draggableBlock).toBe(false);
    expect(container.querySelector(".luthor-editor")).toHaveClass("luthor-editor--draggable-disabled");
    expect(container.querySelector(".luthor-editor-visual-gutter")).toBeNull();
  });

  it("passes placeholder text to RichText with preset placeholder class", () => {
    render(<ExtensiveEditor showDefaultContent={false} placeholder="Start here" />);

    expect(screen.getByText("Start here")).toBeInTheDocument();
    const richTextCall = richTextMock.mock.calls.at(-1)?.[0] as {
      placeholder?: string;
      classNames?: { placeholder?: string };
    };
    expect(richTextCall.placeholder).toBe("Start here");
    expect(richTextCall.classNames?.placeholder).toBe(
      "luthor-placeholder luthor-preset-extensive__placeholder",
    );
  });

  it("supports mode-specific placeholder pass-through for visual and jsonb modes", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="jsonb"
        placeholder={{
          visual: "Write in visual mode",
          jsonb: "Paste JSONB here",
        }}
      />,
    );

    const richTextCall = richTextMock.mock.calls.at(-1)?.[0] as {
      placeholder?: string;
    };
    expect(richTextCall.placeholder).toBe("Write in visual mode");

    const sourceViewCall = sourceViewMock.mock.calls.at(-1)?.[0] as {
      placeholder?: string;
    };
    expect(sourceViewCall.placeholder).toBe("Paste JSONB here");
    expect(screen.getByTestId("source-view")).toHaveAttribute(
      "data-placeholder",
      "Paste JSONB here",
    );
  });
});
