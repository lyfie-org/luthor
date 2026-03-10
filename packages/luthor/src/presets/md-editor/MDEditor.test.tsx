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

  it("locks modes to visual, json, and markdown", () => {
    render(<MDEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      availableModes?: string[];
      initialMode?: string;
    };

    expect(props.availableModes).toEqual(["visual", "json", "markdown"]);
    expect(props.initialMode).toBe("visual");
  });

  it("applies markdown-native defaults and disables metadata-dependent features", () => {
    render(<MDEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
      toolbarLayout?: { sections?: Array<{ items?: string[] }> };
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
        table: false,
        image: false,
        iframeEmbed: false,
        youTubeEmbed: false,
        customNode: false,
        draggableBlock: false,
      }),
    );
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("table") ||
        (section.items ?? []).includes("image") ||
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
