import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createExtensiveExtensionsMock,
  providerMock,
  richTextMock,
  sourceViewMock,
  markdownToJSONMock,
  htmlToJSONMock,
  jsonToMarkdownMock,
  jsonToHTMLMock,
} = vi.hoisted(() => ({
  createExtensiveExtensionsMock: vi.fn(() => []),
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
    expect(mockEditorApi.commands.formatText).toHaveBeenCalledWith("code");
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
});
