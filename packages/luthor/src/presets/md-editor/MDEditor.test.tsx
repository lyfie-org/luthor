import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { extensiveEditorMock } = vi.hoisted(() => ({
  extensiveEditorMock: vi.fn(() => null),
}));

vi.mock("../extensive", () => ({
  ExtensiveEditor: extensiveEditorMock,
  createExtensiveExtensions: vi.fn(() => []),
}));

import { MDEditor } from "./MDEditor";

describe("MDEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks modes to visual-only, visual, json, and markdown", () => {
    render(<MDEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      availableModes?: string[];
      initialMode?: string;
      isListStyleDropdownEnabled?: boolean;
    };

    expect(props.availableModes).toEqual(["visual-only", "visual", "json", "markdown"]);
    expect(props.initialMode).toBe("visual");
    expect(props.isListStyleDropdownEnabled).toBe(false);
  });

  it("applies markdown-native defaults with metadata-free source conversion", () => {
    render(<MDEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
      toolbarLayout?: { sections?: Array<{ items?: string[] }> };
      sourceMetadataMode?: string;
      markdownBridgeFlavor?: string;
      markdownSourceOfTruth?: boolean;
    };

    expect(props.featureFlags).toEqual(
      expect.objectContaining({
        bold: true,
        italic: true,
        strikethrough: true,
        code: true,
        codeFormat: true,
        link: true,
        list: true,
        blockFormat: true,
        horizontalRule: true,
        table: true,
        image: true,
        iframeEmbed: false,
        youTubeEmbed: false,
        customNode: false,
        draggableBlock: false,
        tabIndent: true,
      }),
    );
    expect(props.sourceMetadataMode).toBe("none");
    expect(props.markdownBridgeFlavor).toBe("github");
    expect(props.markdownSourceOfTruth).toBe(true);
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("codeBlock"),
      ),
    ).toBe(true);
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("table"),
      ),
    ).toBe(true);
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("image"),
      ),
    ).toBe(true);
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("horizontalRule"),
      ),
    ).toBe(true);
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("indentList") &&
        (section.items ?? []).includes("outdentList"),
      ),
    ).toBe(true);
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("alignLeft") &&
        (section.items ?? []).includes("alignCenter") &&
        (section.items ?? []).includes("alignRight") &&
        (section.items ?? []).includes("alignJustify"),
      ),
    ).toBe(true);
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("embed"),
      ),
    ).toBe(false);
  });

  it("supports defaultEditorView alias and class composition", () => {
    render(
      <MDEditor
        showDefaultContent={false}
        defaultEditorView="markdown"
        className="outer"
        variantClassName="inner"
      />,
    );

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      initialMode?: string;
      className?: string;
      variantClassName?: string;
    };

    expect(props.initialMode).toBe("markdown");
    expect(props.className).toContain("luthor-preset-md-editor");
    expect(props.className).toContain("outer");
    expect(props.variantClassName).toContain("luthor-preset-md-editor__variant");
    expect(props.variantClassName).toContain("inner");
  });

  it("falls back to visual for unsupported defaultEditorView values", () => {
    render(
      <MDEditor
        showDefaultContent={false}
        defaultEditorView="html"
      />,
    );

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      initialMode?: string;
    };

    expect(props.initialMode).toBe("visual");
  });
});
