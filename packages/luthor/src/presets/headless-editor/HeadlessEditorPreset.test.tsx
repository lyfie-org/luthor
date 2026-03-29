/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createExtensiveExtensionsMock,
  createEditorThemeStyleVarsMock,
  providerMock,
  richTextMock,
  sourceViewMock,
  markdownToJSONMock,
  htmlToJSONMock,
  jsonToMarkdownMock,
  jsonToHTMLMock,
} = vi.hoisted(() => ({
  createExtensiveExtensionsMock: vi.fn(() => []),
  createEditorThemeStyleVarsMock: vi.fn((overrides?: Record<string, string>) => overrides),
  providerMock: vi.fn(),
  richTextMock: vi.fn(({ placeholder }: { placeholder?: string }) => (
    <div data-testid="richtext">{placeholder}</div>
  )),
  sourceViewMock: vi.fn(
    ({
      value,
      onChange,
      placeholder,
      className,
      wrap,
      showLineNumbers,
    }: {
      value: string;
      onChange: (value: string) => void;
      placeholder: string;
      className?: string;
      wrap?: "soft" | "hard" | "off";
      showLineNumbers?: boolean;
    }) => (
      <textarea
        data-testid="source-view"
        data-placeholder={placeholder}
        data-classname={className}
        data-wrap={wrap}
        data-line-numbers={showLineNumbers ? "true" : "false"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  ),
  markdownToJSONMock: vi.fn(() => ({ root: { children: [{ type: "paragraph" }] } })),
  htmlToJSONMock: vi.fn(() => ({ root: { children: [{ type: "paragraph" }] } })),
  jsonToMarkdownMock: vi.fn(() => "## heading"),
  jsonToHTMLMock: vi.fn(() => "<p>heading</p>"),
}));

const mockEditorApi = {
  activeStates: {
    bold: false,
    italic: false,
    strikethrough: false,
    code: false,
    isParagraph: true,
    isH1: false,
    isH2: false,
    isH3: false,
    isH4: false,
    isH5: false,
    isH6: false,
    unorderedList: false,
    orderedList: false,
    isInCodeBlock: false,
    isQuote: false,
    canUndo: true,
    canRedo: true,
  },
  commands: {
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleStrikethrough: vi.fn(),
    formatText: vi.fn(),
    removeLink: vi.fn(),
    toggleParagraph: vi.fn(),
    toggleHeading: vi.fn(),
    toggleUnorderedList: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleCodeBlock: vi.fn(),
    toggleQuote: vi.fn(),
    insertHorizontalRule: vi.fn(),
    insertHardBreak: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  },
  export: {
    toJSON: vi.fn(() => ({ root: { children: [{ type: "paragraph" }] } })),
  },
  import: {
    fromJSON: vi.fn(),
  },
};

vi.mock("../extensive", () => ({
  extensiveExtensions: [],
  createExtensiveExtensions: createExtensiveExtensionsMock,
}));

vi.mock("../../core", () => ({
  ModeTabs: ({
    mode,
    labels,
    availableModes,
    onModeChange,
  }: {
    mode: string;
    labels?: Record<string, string>;
    availableModes?: string[];
    onModeChange: (mode: string) => void;
  }) => (
    <div data-testid="mode-tabs">
      {(availableModes ?? []).map((tabMode) => (
        <button
          key={tabMode}
          type="button"
          data-active={mode === tabMode}
          onClick={() => onModeChange(tabMode)}
        >
          {labels?.[tabMode] ?? tabMode}
        </button>
      ))}
    </div>
  ),
  SourceView: sourceViewMock,
  formatJSONSource: (value: string) => value,
  formatMarkdownSource: (value: string) => value,
  formatHTMLSource: (value: string) => value,
}));

vi.mock("@lyfie/luthor-headless", () => ({
  createEditorSystem: () => ({
    Provider: ({ children }: { children: ReactNode }) => {
      providerMock();
      return <>{children}</>;
    },
    useEditor: () => mockEditorApi,
  }),
  RichText: richTextMock,
  markdownToJSON: markdownToJSONMock,
  htmlToJSON: htmlToJSONMock,
  jsonToMarkdown: jsonToMarkdownMock,
  jsonToHTML: jsonToHTMLMock,
  createEditorThemeStyleVars: createEditorThemeStyleVarsMock,
}));

import { HeadlessEditorPreset } from "./HeadlessEditorPreset";

describe("HeadlessEditorPreset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditorApi.activeStates = {
      ...mockEditorApi.activeStates,
      bold: false,
      italic: false,
      strikethrough: false,
      code: false,
      unorderedList: false,
      orderedList: false,
      isQuote: false,
      isInCodeBlock: false,
      canUndo: true,
      canRedo: true,
    };
  });

  it("uses the headless feature profile and renders text-button toolbar + source tabs", () => {
    render(<HeadlessEditorPreset showDefaultContent={false} />);

    const extensionConfig = createExtensiveExtensionsMock.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
    };

    expect(extensionConfig.featureFlags).toEqual(
      expect.objectContaining({
        bold: true,
        italic: true,
        strikethrough: true,
        code: true,
        codeIntelligence: true,
        codeFormat: true,
        list: true,
        blockFormat: true,
        history: true,
        draggableBlock: false,
        themeToggle: false,
        table: false,
        image: false,
        iframeEmbed: false,
        youTubeEmbed: false,
        slashCommand: false,
      }),
    );

    expect(screen.getByRole("button", { name: "Visual" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Visual Only" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MD" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "HTML" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Strike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Code block" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hard break" })).toBeInTheDocument();
  });

  it("keeps restricted feature flags disabled even when overrides request them", () => {
    render(
      <HeadlessEditorPreset
        showDefaultContent={false}
        featureFlags={{
          draggableBlock: true,
          themeToggle: true,
          table: true,
          commandPalette: true,
          bold: false,
          codeIntelligence: false,
        }}
      />,
    );

    const extensionConfig = createExtensiveExtensionsMock.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
    };

    expect(extensionConfig.featureFlags?.bold).toBe(false);
    expect(extensionConfig.featureFlags?.draggableBlock).toBe(false);
    expect(extensionConfig.featureFlags?.themeToggle).toBe(false);
    expect(extensionConfig.featureFlags?.table).toBe(false);
    expect(extensionConfig.featureFlags?.commandPalette).toBe(false);
    expect(extensionConfig.featureFlags?.codeIntelligence).toBe(false);
  });

  it("passes line number visibility to extension factory and source views", () => {
    render(
      <HeadlessEditorPreset
        showDefaultContent={false}
        defaultEditorView="json"
        showLineNumbers={false}
      />,
    );

    const extensionConfig = createExtensiveExtensionsMock.mock.calls.at(-1)?.[0] as {
      showLineNumbers?: boolean;
    };

    expect(extensionConfig.showLineNumbers).toBe(false);
    expect(screen.getByTestId("source-view")).toHaveAttribute("data-line-numbers", "false");
  });

  it("supports syntax highlighting opt-out with isSyntaxHighlightingEnabled", () => {
    render(
      <HeadlessEditorPreset
        showDefaultContent={false}
        isSyntaxHighlightingEnabled={false}
      />,
    );

    const extensionConfig = createExtensiveExtensionsMock.mock.calls.at(-1)?.[0] as {
      syntaxHighlighting?: "auto" | "disabled";
    };

    expect(extensionConfig.syntaxHighlighting).toBe("disabled");
  });

  it("applies custom syntax colors when custom mode is enabled", () => {
    render(
      <HeadlessEditorPreset
        showDefaultContent={false}
        syntaxHighlightColorMode="custom"
        syntaxHighlightColors={{
          light: {
            comment: "#111111",
            keyword: "#222222",
          },
        }}
      />,
    );

    const wrapper = document.querySelector(".luthor-preset-headless-editor") as HTMLElement;
    expect(wrapper.style.getPropertyValue("--luthor-syntax-comment")).toBe("#111111");
    expect(wrapper.style.getPropertyValue("--luthor-syntax-keyword")).toBe("#222222");
    expect(createEditorThemeStyleVarsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        "--luthor-syntax-comment": "#111111",
      }),
    );
  });

  it("supports wrapper classes and defaultEditorView mode aliases", () => {
    const { container } = render(
      <HeadlessEditorPreset
        showDefaultContent={false}
        className="custom-class"
        variantClassName="custom-variant"
        defaultEditorView="html"
      />,
    );

    const wrapper = container.querySelector(".luthor-preset-headless-editor");
    expect(wrapper).toHaveClass("custom-class");
    expect(wrapper).toHaveClass("custom-variant");

    expect(screen.getByRole("button", { name: "HTML" })).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("source-view")).toBeInTheDocument();
  });

  it("applies and updates wrapper theme from initialTheme", async () => {
    const onThemeChange = vi.fn();
    const { container, rerender } = render(
      <HeadlessEditorPreset
        showDefaultContent={false}
        initialTheme="dark"
        onThemeChange={onThemeChange}
      />,
    );

    const wrapper = container.querySelector(".luthor-preset-headless-editor");
    expect(wrapper).toHaveAttribute("data-editor-theme", "dark");

    await waitFor(() => {
      expect(onThemeChange).toHaveBeenCalledWith("dark");
    });

    rerender(
      <HeadlessEditorPreset
        showDefaultContent={false}
        initialTheme="light"
        onThemeChange={onThemeChange}
      />,
    );

    expect(wrapper).toHaveAttribute("data-editor-theme", "light");

    await waitFor(() => {
      expect(onThemeChange).toHaveBeenLastCalledWith("light");
    });
  });

  it("routes markdown source back into visual mode and surfaces source errors", async () => {
    render(<HeadlessEditorPreset showDefaultContent={false} />);

    fireEvent.click(screen.getByRole("button", { name: "MD" }));
    fireEvent.change(screen.getByTestId("source-view"), {
      target: { value: "## Updated title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Visual" }));

    await waitFor(() => {
      expect(markdownToJSONMock).toHaveBeenCalledWith("## Updated title");
    });
    expect(mockEditorApi.import.fromJSON).toHaveBeenCalled();

    markdownToJSONMock.mockImplementationOnce(() => {
      throw new Error("Broken markdown");
    });

    fireEvent.click(screen.getByRole("button", { name: "MD" }));
    fireEvent.change(screen.getByTestId("source-view"), {
      target: { value: "## broken" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Visual" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid Markdown")).toBeInTheDocument();
      expect(screen.getByText("Broken markdown")).toBeInTheDocument();
    });
    expect(screen.getByTestId("source-view")).toBeInTheDocument();
  });

  it("executes core toolbar commands including clear actions and hard break", () => {
    mockEditorApi.activeStates = {
      ...mockEditorApi.activeStates,
      bold: true,
      italic: true,
      strikethrough: true,
      code: true,
      unorderedList: true,
      orderedList: true,
      isQuote: true,
      isInCodeBlock: true,
    };

    render(<HeadlessEditorPreset showDefaultContent={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear marks" }));
    expect(mockEditorApi.commands.toggleBold).toHaveBeenCalled();
    expect(mockEditorApi.commands.toggleItalic).toHaveBeenCalled();
    expect(mockEditorApi.commands.toggleStrikethrough).toHaveBeenCalled();
    expect(mockEditorApi.commands.formatText).not.toHaveBeenCalled();
    expect(mockEditorApi.commands.removeLink).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Clear nodes" }));
    expect(mockEditorApi.commands.toggleUnorderedList).toHaveBeenCalled();
    expect(mockEditorApi.commands.toggleOrderedList).toHaveBeenCalled();
    expect(mockEditorApi.commands.toggleQuote).toHaveBeenCalled();
    expect(mockEditorApi.commands.toggleCodeBlock).toHaveBeenCalled();
    expect(mockEditorApi.commands.toggleParagraph).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Hard break" }));
    expect(mockEditorApi.commands.insertHardBreak).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(mockEditorApi.commands.undo).toHaveBeenCalled();
    expect(mockEditorApi.commands.redo).toHaveBeenCalled();
  });

  it("disables inline code controls while the selection is inside a code block", () => {
    mockEditorApi.activeStates = {
      ...mockEditorApi.activeStates,
      isInCodeBlock: true,
      code: true,
    };

    render(<HeadlessEditorPreset showDefaultContent={false} />);

    const codeButton = screen.getByRole("button", { name: "Code" });
    expect(codeButton).toBeDisabled();

    fireEvent.click(codeButton);
    expect(mockEditorApi.commands.formatText).not.toHaveBeenCalled();
  });

  it("calls onReady only once even if editor api references change across rerenders", () => {
    const onReady = vi.fn();
    const { rerender } = render(
      <HeadlessEditorPreset showDefaultContent={false} onReady={onReady} />,
    );

    expect(onReady).toHaveBeenCalledTimes(1);

    mockEditorApi.export = {
      toJSON: vi.fn(() => ({ root: { children: [{ type: "paragraph" }] } })),
    };
    mockEditorApi.import = {
      fromJSON: vi.fn(),
    };

    rerender(<HeadlessEditorPreset showDefaultContent={false} onReady={onReady} />);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("provides JSON, markdown, and html getters via onReady methods", () => {
    const exportedDocument = { root: { children: [{ type: "paragraph", marker: "from-visual" }] } };
    const onReady = vi.fn();
    mockEditorApi.export.toJSON.mockReturnValue(exportedDocument);
    jsonToMarkdownMock.mockReturnValue("## heading");
    jsonToHTMLMock.mockReturnValue("<p>heading</p>");

    render(<HeadlessEditorPreset showDefaultContent={false} onReady={onReady} />);

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
});
