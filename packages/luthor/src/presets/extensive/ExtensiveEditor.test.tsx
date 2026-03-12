import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  htmlToJSONMock,
  jsonToHTMLMock,
  jsonToMarkdownMock,
  markdownToJSONMock,
  richTextMock,
  sourceViewMock,
  setFloatingToolbarContextMock,
  slashCommandMenuMock,
  emojiSuggestionMenuMock,
  linkHoverBubbleMock,
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
  htmlToJSONMock: vi.fn(() => ({ root: { children: [] } })),
  jsonToHTMLMock: vi.fn(() => "<p></p>"),
  jsonToMarkdownMock: vi.fn(() => ""),
  markdownToJSONMock: vi.fn(() => ({ root: { children: [] } })),
  richTextMock: vi.fn(
    ({
      placeholder,
      classNames,
      nonEditableVisualMode,
      onEditIntent,
    }: {
      placeholder?: string;
      classNames?: { placeholder?: string };
      nonEditableVisualMode?: boolean;
      onEditIntent?: (position: { clientX: number; clientY: number }) => void;
    }) => (
      <button
        type="button"
        data-testid="richtext"
        data-placeholder-class={classNames?.placeholder}
        data-non-editable-visual-mode={nonEditableVisualMode ? "true" : "false"}
        onClick={() => onEditIntent?.({ clientX: 88, clientY: 144 })}
      >
        {placeholder}
      </button>
    ),
  ),
  sourceViewMock: vi.fn(
    ({
      value,
      onChange,
      placeholder,
      className,
      wrap,
    }: {
      value: string;
      onChange: (value: string) => void;
      placeholder: string;
      className?: string;
      wrap?: "soft" | "hard" | "off";
    }) => (
      <textarea
        data-testid="source-view"
        data-placeholder={placeholder}
        data-classname={className}
        data-wrap={wrap}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  ),
  setFloatingToolbarContextMock: vi.fn(),
  slashCommandMenuMock: vi.fn(() => null),
  emojiSuggestionMenuMock: vi.fn(() => null),
  linkHoverBubbleMock: vi.fn(() => null),
}));

vi.mock("lexical", () => ({
  $setSelection: vi.fn(),
}));

vi.mock("./extensions", () => ({
  extensiveExtensions: [],
  createExtensiveExtensions: createExtensiveExtensionsMock,
  setFloatingToolbarContext: setFloatingToolbarContextMock,
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
  SlashCommandMenu: slashCommandMenuMock,
  EmojiSuggestionMenu: emojiSuggestionMenuMock,
  commandsToCommandPaletteItems: commandsToCommandPaletteItemsMock,
  commandsToSlashCommandItems: commandsToSlashCommandItemsMock,
  formatHTMLSource: (value: string) => value,
  formatJSONSource: (value: string) => value,
  formatMarkdownSource: (value: string) => value,
  ModeTabs: ({ availableModes, onModeChange }: { availableModes?: string[]; onModeChange: (mode: string) => void }) => (
    <div data-testid="mode-tabs">
      {(availableModes ?? ["visual-editor", "json"]).map((mode) => (
        <button key={mode} type="button" onClick={() => onModeChange(mode)}>
          {mode}
        </button>
      ))}
    </div>
  ),
  registerKeyboardShortcuts: registerKeyboardShortcutsMock,
  generateCommands: vi.fn(() => [
    { id: "format.bold", shortcuts: [{ key: "b", ctrlKey: true }] },
    { id: "format.italic", shortcuts: [{ key: "i", ctrlKey: true }] },
    { id: "insert.table", shortcuts: [] },
  ]),
  SourceView: sourceViewMock,
  LinkHoverBubble: linkHoverBubbleMock,
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
  htmlToJSON: htmlToJSONMock,
  jsonToHTML: jsonToHTMLMock,
  jsonToMarkdown: jsonToMarkdownMock,
  markdownToJSON: markdownToJSONMock,
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
    const topSlot = container.querySelector(".luthor-editor-toolbar-slot--top");

    expect(toolbar).toHaveClass("luthor-toolbar");
    expect(toolbar).toHaveClass("luthor-toolbar--align-left");
    expect(header).not.toContainElement(toolbar);
    expect(topSlot).toContainElement(toolbar);
    expect(container.querySelector(".luthor-editor-toolbar-slot--bottom")).toBeNull();
  });

  it("enables visual-only, visual-editor, json, markdown, and html modes by default", () => {
    render(<ExtensiveEditor showDefaultContent={false} />);

    expect(screen.getByRole("button", { name: "visual-only" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "visual-editor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "json" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "html" })).toBeInTheDocument();
  });

  it("accepts legacy visual mode values as aliases for visual-editor", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="visual"
        availableModes={["visual-only", "visual", "json"]}
      />,
    );

    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "visual" })).toBeInTheDocument();
  });

  it("renders toolbar in the bottom slot when toolbarPosition is bottom", () => {
    const { container } = render(<ExtensiveEditor showDefaultContent={false} toolbarPosition="bottom" />);

    const toolbar = screen.getByTestId("toolbar");
    const header = container.querySelector(".luthor-editor-header");
    const bottomSlot = container.querySelector(".luthor-editor-toolbar-slot--bottom");

    expect(header).not.toContainElement(toolbar);
    expect(bottomSlot).toContainElement(toolbar);
  });

  it("pins tabs + toolbar together when tabs are visible and isToolbarPinned is true", () => {
    const { container } = render(<ExtensiveEditor showDefaultContent={false} isToolbarPinned />);

    const topRegion = container.querySelector(".luthor-editor-top-region");
    const topSlot = container.querySelector(".luthor-editor-toolbar-slot--top");
    const wrapper = container.querySelector(".luthor-editor-wrapper");

    expect(topRegion).toHaveClass("luthor-editor-top-region--pinned");
    expect(topSlot).not.toHaveClass("luthor-editor-toolbar-slot--pinned");
    expect(wrapper).toHaveClass("luthor-editor-wrapper--toolbar-pinned");
  });

  it("keeps pinned classes when rendered in demo app scroll container structure", () => {
    const { container } = render(
      <div className="editor-stage" style={{ overflow: "auto", maxHeight: "480px" }}>
        <div className="editor-frame">
          <ExtensiveEditor showDefaultContent={false} isToolbarPinned />
        </div>
      </div>,
    );

    const topRegion = container.querySelector(".luthor-editor-top-region");
    const topSlot = container.querySelector(".luthor-editor-toolbar-slot--top");
    const wrapper = container.querySelector(".luthor-editor-wrapper");

    expect(topRegion).toHaveClass("luthor-editor-top-region--pinned");
    expect(topSlot).not.toHaveClass("luthor-editor-toolbar-slot--pinned");
    expect(wrapper).toHaveClass("luthor-editor-wrapper--toolbar-pinned");
  });

  it("keeps pinned classes when rendered in web homepage editor pane structure", () => {
    const { container } = render(
      <div className="browser-frame demo-showcase-frame">
        <div className="editor-pane demo-showcase-editor-pane" style={{ overflow: "auto", minHeight: 0 }}>
          <ExtensiveEditor showDefaultContent={false} isToolbarPinned />
        </div>
      </div>,
    );

    const topRegion = container.querySelector(".luthor-editor-top-region");
    const topSlot = container.querySelector(".luthor-editor-toolbar-slot--top");
    const wrapper = container.querySelector(".luthor-editor-wrapper");

    expect(topRegion).toHaveClass("luthor-editor-top-region--pinned");
    expect(topSlot).not.toHaveClass("luthor-editor-toolbar-slot--pinned");
    expect(wrapper).toHaveClass("luthor-editor-wrapper--toolbar-pinned");
  });

  it("pins toolbar directly at the top when editor view tabs are hidden", () => {
    const { container } = render(
      <ExtensiveEditor
        showDefaultContent={false}
        isToolbarPinned
        isEditorViewTabsVisible={false}
      />,
    );

    const topRegion = container.querySelector(".luthor-editor-top-region");
    const topSlot = container.querySelector(".luthor-editor-toolbar-slot--top");

    expect(screen.queryByTestId("mode-tabs")).toBeNull();
    expect(topRegion).not.toHaveClass("luthor-editor-top-region--pinned");
    expect(topSlot).toHaveClass("luthor-editor-toolbar-slot--pinned");
  });

  it("renders pinned top region inside .luthor-editor so nested scroll containers can stick correctly", () => {
    const { container } = render(<ExtensiveEditor showDefaultContent={false} isToolbarPinned />);

    const editor = container.querySelector(".luthor-editor");
    const topRegion = container.querySelector(".luthor-editor-top-region");

    expect(editor).toContainElement(topRegion);
    expect(editor?.firstElementChild).toBe(topRegion);
  });

  it("keeps top toolbar slot inside .luthor-editor when tabs are hidden", () => {
    const { container } = render(
      <ExtensiveEditor
        showDefaultContent={false}
        isToolbarPinned
        isEditorViewTabsVisible={false}
      />,
    );

    const editor = container.querySelector(".luthor-editor");
    const topSlot = container.querySelector(".luthor-editor-toolbar-slot--top");

    expect(editor).toContainElement(topSlot);
  });

  it("patches non-scrolling overflow:auto ancestors for demo-like page-scroll usage", async () => {
    const { getByTestId } = render(
      <div data-testid="demo-stage" style={{ overflowY: "auto" }}>
        <ExtensiveEditor showDefaultContent={false} isToolbarPinned />
      </div>,
    );

    const stage = getByTestId("demo-stage") as HTMLDivElement;
    Object.defineProperty(stage, "clientHeight", { configurable: true, value: 600 });
    Object.defineProperty(stage, "scrollHeight", { configurable: true, value: 600 });

    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(stage.style.overflowY).toBe("visible");
    });
  });

  it("keeps active overflow:auto scroll ancestors unchanged for web-homepage nested scroll usage", async () => {
    const { getByTestId } = render(
      <div data-testid="web-editor-pane" style={{ overflowY: "auto" }}>
        <ExtensiveEditor showDefaultContent={false} isToolbarPinned />
      </div>,
    );

    const pane = getByTestId("web-editor-pane") as HTMLDivElement;
    Object.defineProperty(pane, "clientHeight", { configurable: true, value: 320 });
    Object.defineProperty(pane, "scrollHeight", { configurable: true, value: 920 });

    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(pane.style.overflowY).toBe("auto");
    });
  });

  it("restores patched overflow:auto ancestors on unmount", async () => {
    const { getByTestId, unmount } = render(
      <div data-testid="demo-stage" style={{ overflowY: "auto" }}>
        <ExtensiveEditor showDefaultContent={false} isToolbarPinned />
      </div>,
    );

    const stage = getByTestId("demo-stage") as HTMLDivElement;
    Object.defineProperty(stage, "clientHeight", { configurable: true, value: 600 });
    Object.defineProperty(stage, "scrollHeight", { configurable: true, value: 600 });

    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(stage.style.overflowY).toBe("visible");
    });

    unmount();
    expect(stage.style.overflowY).toBe("auto");
  });

  it("supports defaultEditorView and starts in json mode when requested", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        defaultEditorView="json"
        isEditorViewTabsVisible={false}
      />,
    );

    expect(screen.queryByTestId("mode-tabs")).toBeNull();
    expect(screen.getByTestId("source-view")).toBeInTheDocument();
    expect(screen.queryByTestId("toolbar")).toBeNull();
  });

  it("hides editor view tabs with the alias prop isEditorViewsTabVisible", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        isEditorViewsTabVisible={false}
      />,
    );

    expect(screen.queryByTestId("mode-tabs")).toBeNull();
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

  it("renders visual-only mode as non-editable and hides toolbar affordances", () => {
    const { container } = render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="visual-only"
      />,
    );

    const richTextCall = richTextMock.mock.calls.at(-1)?.[0] as {
      nonEditableVisualMode?: boolean;
      onEditIntent?: unknown;
    };
    expect(richTextCall.nonEditableVisualMode).toBe(true);
    expect(richTextCall.onEditIntent).toBeTypeOf("function");
    expect(screen.queryByTestId("toolbar")).toBeNull();
    expect(screen.queryByTestId("source-view")).toBeNull();
    expect(container.querySelector(".luthor-editor")).toHaveClass("luthor-editor--draggable-disabled");
    expect(container.querySelector(".luthor-editor-visual-gutter")).toBeNull();
  });

  it("hides draggable affordances outside visual-editor mode even when draggable is enabled", async () => {
    const { container } = render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="json"
        availableModes={["visual-editor", "json"]}
      />,
    );

    expect(container.querySelector(".luthor-editor")).toHaveClass("luthor-editor--draggable-disabled");
    expect(container.querySelector(".luthor-editor-visual-gutter")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "visual-editor" }));
    await waitFor(() => {
      expect(container.querySelector(".luthor-editor")).not.toHaveClass("luthor-editor--draggable-disabled");
    });
    expect(container.querySelector(".luthor-editor-visual-gutter")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "json" }));
    await waitFor(() => {
      expect(container.querySelector(".luthor-editor")).toHaveClass("luthor-editor--draggable-disabled");
    });
    expect(container.querySelector(".luthor-editor-visual-gutter")).toBeNull();
  });

  it("disables editing overlays and editing menu shortcuts in visual-only mode", () => {
    const subscribe = vi.fn((listener: (isOpen: boolean, items: Array<{ id: string; shortcut?: string }>) => void) => {
      listener(true, [{ id: "format.bold", shortcut: "Ctrl+B" }]);
      return () => {};
    });
    mockEditorApi.extensions = [{ name: "commandPalette", subscribe }] as any;

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="visual-only"
      />,
    );

    expect(commandPaletteMock).not.toHaveBeenCalled();
    expect(slashCommandMenuMock).not.toHaveBeenCalled();
    expect(emojiSuggestionMenuMock).not.toHaveBeenCalled();
    expect(mockEditorApi.commands.hideCommandPalette).toHaveBeenCalled();
    expect(mockEditorApi.commands.closeSlashMenu).toHaveBeenCalled();
    expect(mockEditorApi.commands.closeEmojiSuggestions).toHaveBeenCalled();

    const floatingToolbarCall = setFloatingToolbarContextMock.mock.calls.at(-1) as
      | [unknown, unknown, unknown, ((feature: string) => boolean)?]
      | undefined;
    expect(floatingToolbarCall?.[3]?.("bold")).toBe(false);
    expect(floatingToolbarCall?.[3]?.("commandPalette")).toBe(false);

    const shortcutRegistrationCall = registerKeyboardShortcutsMock.mock.calls.at(-1) as
      | [unknown, unknown, { isFeatureEnabled?: (feature: string) => boolean }]
      | undefined;
    expect(shortcutRegistrationCall?.[2]?.isFeatureEnabled?.("bold")).toBe(false);
    expect(shortcutRegistrationCall?.[2]?.isFeatureEnabled?.("commandPalette")).toBe(false);
  });

  it("switches from visual-only to visual-editor when editOnClick is enabled", async () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="visual-only"
        availableModes={["visual-only", "visual-editor", "json"]}
        editOnClick
      />,
    );

    expect(screen.queryByTestId("toolbar")).toBeNull();
    fireEvent.click(screen.getByTestId("richtext"));

    await waitFor(() => {
      expect(screen.getByTestId("toolbar")).toBeInTheDocument();
      expect(mockEditorApi.lexical.focus).toHaveBeenCalled();
    });
  });

  it("places caret near clicked line when editOnClick transitions to visual-editor mode", async () => {
    const getSelectionSpy = vi.spyOn(window, "getSelection").mockReturnValue({
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    } as unknown as Selection);

    const offsetNode = document.createTextNode("line");
    const editable = document.createElement("div");
    const line = document.createElement("p");
    line.append(offsetNode);
    editable.append(line);

    Object.defineProperty(editable, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        right: 500,
      }),
    });
    Object.defineProperty(line, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        top: 120,
        bottom: 180,
        height: 60,
      }),
    });

    const originalGetRootElement = mockEditorApi.lexical.getRootElement;
    mockEditorApi.lexical.getRootElement = vi.fn(() => editable);

    const caretPositionFromPointMock = vi.fn(() => ({
      offsetNode,
      offset: 0,
    }));
    const originalCaretPositionFromPoint = (
      document as Document & {
        caretPositionFromPoint?: unknown;
      }
    ).caretPositionFromPoint;
    Object.defineProperty(document, "caretPositionFromPoint", {
      configurable: true,
      value: caretPositionFromPointMock,
    });

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="visual-only"
        availableModes={["visual-only", "visual-editor"]}
        editOnClick
      />,
    );

    fireEvent.click(screen.getByTestId("richtext"));

    await waitFor(() => {
      expect(caretPositionFromPointMock).toHaveBeenCalled();
    });

    getSelectionSpy.mockRestore();
    Object.defineProperty(document, "caretPositionFromPoint", {
      configurable: true,
      value: originalCaretPositionFromPoint,
    });
    mockEditorApi.lexical.getRootElement = originalGetRootElement;
  });

  it("keeps visual-only mode locked when editOnClick is disabled", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="visual-only"
        availableModes={["visual-only", "visual-editor", "json"]}
        editOnClick={false}
      />,
    );

    fireEvent.click(screen.getByTestId("richtext"));
    expect(screen.queryByTestId("toolbar")).toBeNull();
    expect(mockEditorApi.lexical.focus).not.toHaveBeenCalled();
  });

  it("supports mode-specific placeholder pass-through for visual and json modes", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="json"
        placeholder={{
          visual: "Write in visual mode",
          json: "Paste JSON here",
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
    expect(sourceViewCall.placeholder).toBe("Paste JSON here");
    expect(screen.getByTestId("source-view")).toHaveAttribute(
      "data-placeholder",
      "Paste JSON here",
    );
  });

  it("supports mode-specific placeholder pass-through for markdown mode", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="markdown"
        availableModes={["visual-editor", "markdown"]}
        placeholder={{
          visual: "Write in visual mode",
          markdown: "Write markdown here",
        }}
      />,
    );

    const sourceViewCall = sourceViewMock.mock.calls.at(-1)?.[0] as {
      placeholder?: string;
    };
    expect(sourceViewCall.placeholder).toBe("Write markdown here");
    expect(screen.getByTestId("source-view")).toHaveAttribute(
      "data-placeholder",
      "Write markdown here",
    );
    expect(screen.getByTestId("source-view")).toHaveAttribute(
      "data-wrap",
      "soft",
    );
    expect(screen.getByTestId("source-view")).toHaveAttribute(
      "data-classname",
      "luthor-source-view--wrapped",
    );
  });

  it("supports mode-specific placeholder pass-through for html mode", () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="html"
        availableModes={["visual-editor", "html"]}
        placeholder={{
          visual: "Write in visual mode",
          html: "Write HTML here",
        }}
      />,
    );

    const sourceViewCall = sourceViewMock.mock.calls.at(-1)?.[0] as {
      placeholder?: string;
    };
    expect(sourceViewCall.placeholder).toBe("Write HTML here");
    expect(screen.getByTestId("source-view")).toHaveAttribute(
      "data-placeholder",
      "Write HTML here",
    );
    expect(screen.getByTestId("source-view")).toHaveAttribute(
      "data-wrap",
      "soft",
    );
    expect(screen.getByTestId("source-view")).toHaveAttribute(
      "data-classname",
      "luthor-source-view--wrapped",
    );
  });

  it("routes markdown to json transitions through the visual import/export pipeline", async () => {
    const importedDocument = { root: { children: [{ type: "paragraph" }] } };
    const exportedDocument = { root: { children: [{ type: "paragraph", marker: "from-visual" }] } };
    markdownToJSONMock.mockReturnValueOnce(importedDocument);
    mockEditorApi.export.toJSON.mockReturnValue(exportedDocument);

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="markdown"
        availableModes={["visual-editor", "markdown", "json"]}
      />,
    );

    fireEvent.change(screen.getByTestId("source-view"), {
      target: { value: "## Draft heading" },
    });
    fireEvent.click(screen.getByRole("button", { name: "json" }));

    await waitFor(() => {
      expect(markdownToJSONMock).toHaveBeenCalledWith("## Draft heading");
    });
    expect(mockEditorApi.import.fromJSON).toHaveBeenCalledWith(importedDocument);
    await waitFor(() => {
      expect(screen.getByTestId("source-view")).toHaveValue(JSON.stringify(exportedDocument));
    });
  });

  it("exposes JSON, markdown, and html getters through onReady methods", () => {
    const exportedDocument = { root: { children: [{ type: "paragraph", marker: "from-visual" }] } };
    const onReady = vi.fn();
    mockEditorApi.export.toJSON.mockReturnValue(exportedDocument);
    jsonToMarkdownMock.mockReturnValue("## heading");
    jsonToHTMLMock.mockReturnValue("<p>heading</p>");

    render(<ExtensiveEditor showDefaultContent={false} onReady={onReady} />);

    expect(onReady).toHaveBeenCalledTimes(1);
    const methods = onReady.mock.calls[0]?.[0] as {
      getJSON: () => string;
      getMarkdown: () => string;
      getHTML: () => string;
    };

    expect(methods.getJSON()).toBe(JSON.stringify(exportedDocument));
    expect(methods.getMarkdown()).toBe("## heading");
    expect(methods.getHTML()).toBe("<p>heading</p>");
    expect(jsonToMarkdownMock).toHaveBeenCalledWith(exportedDocument);
    expect(jsonToHTMLMock).toHaveBeenCalledWith(exportedDocument);
  });

  it("does not re-import untouched html source when returning to visual-editor mode", async () => {
    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="html"
        availableModes={["visual-editor", "html"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "visual-editor" }));

    await waitFor(() => {
      expect(screen.queryByTestId("source-view")).not.toBeInTheDocument();
    });
    expect(htmlToJSONMock).not.toHaveBeenCalled();
  });

  it("imports html source only after user edits before switching to visual-editor mode", async () => {
    const importedDocument = { root: { children: [{ type: "paragraph", marker: "from-html" }] } };
    htmlToJSONMock.mockReturnValueOnce(importedDocument);

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="html"
        availableModes={["visual-editor", "html"]}
      />,
    );

    fireEvent.change(screen.getByTestId("source-view"), {
      target: { value: "<p>Updated in html</p>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "visual-editor" }));

    await waitFor(() => {
      expect(htmlToJSONMock).toHaveBeenCalledWith("<p>Updated in html</p>");
    });
    expect(mockEditorApi.import.fromJSON).toHaveBeenCalledWith(importedDocument);
  });

  it("resets visual editor scroll position when switching from source mode", async () => {
    const wrapper = document.createElement("div");
    wrapper.className = "luthor-editor-wrapper";
    wrapper.style.overflowY = "auto";
    wrapper.scrollTop = 240;

    const root = document.createElement("div");
    root.className = "luthor-content-editable";
    root.scrollTop = 180;
    wrapper.append(root);
    document.body.append(wrapper);

    const originalGetRootElement = mockEditorApi.lexical.getRootElement;
    mockEditorApi.lexical.getRootElement = vi.fn(() => root);

    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="json"
        availableModes={["visual-editor", "json"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "visual-editor" }));

    await waitFor(() => {
      expect(root.scrollTop).toBe(0);
      expect(wrapper.scrollTop).toBe(0);
    });
    expect(mockEditorApi.lexical.focus).not.toHaveBeenCalled();

    requestAnimationFrameSpy.mockRestore();
    mockEditorApi.lexical.getRootElement = originalGetRootElement;
  });

  it("shows mode-specific errors and prevents destructive switch on invalid html", async () => {
    htmlToJSONMock.mockImplementationOnce(() => {
      throw new Error("Malformed HTML");
    });

    render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialMode="html"
        availableModes={["visual-editor", "html"]}
      />,
    );

    fireEvent.change(screen.getByTestId("source-view"), {
      target: { value: "<div><p>broken" },
    });
    fireEvent.click(screen.getByRole("button", { name: "visual-editor" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid HTML")).toBeInTheDocument();
      expect(screen.getByText("Malformed HTML")).toBeInTheDocument();
    });
    expect(screen.getByTestId("source-view")).toBeInTheDocument();
  });

  it("emits onThemeChange on mount and when initialTheme prop changes", () => {
    const onThemeChange = vi.fn();
    const { rerender } = render(
      <ExtensiveEditor
        showDefaultContent={false}
        initialTheme="light"
        onThemeChange={onThemeChange}
      />,
    );

    expect(onThemeChange).toHaveBeenLastCalledWith("light");

    rerender(
      <ExtensiveEditor
        showDefaultContent={false}
        initialTheme="dark"
        onThemeChange={onThemeChange}
      />,
    );

    expect(onThemeChange).toHaveBeenLastCalledWith("dark");
  });
});

