import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { extensiveEditorMock } = vi.hoisted(() => ({
  extensiveEditorMock: vi.fn(() => null),
}));

vi.mock("../extensive", () => ({
  ExtensiveEditor: extensiveEditorMock,
  createExtensiveExtensions: vi.fn(() => []),
}));

import { HTMLEditor } from "./HTMLEditor";

describe("HTMLEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks modes to visual, json, and html", () => {
    render(<HTMLEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      availableModes?: string[];
      initialMode?: string;
    };

    expect(props.availableModes).toEqual(["visual", "json", "html"]);
    expect(props.initialMode).toBe("visual");
  });

  it("enables html-safe markdown features and disables metadata-heavy features", () => {
    render(<HTMLEditor showDefaultContent={false} />);

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
        blockFormat: true,
        list: true,
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

  it("respects defaultEditorView and composes class names", () => {
    render(
      <HTMLEditor
        showDefaultContent={false}
        defaultEditorView="html"
        className="outer"
        variantClassName="inner"
      />,
    );

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      initialMode?: string;
      className?: string;
      variantClassName?: string;
    };

    expect(props.initialMode).toBe("html");
    expect(props.className).toContain("luthor-preset-html-editor");
    expect(props.className).toContain("outer");
    expect(props.variantClassName).toContain("luthor-preset-html-editor__variant");
    expect(props.variantClassName).toContain("inner");
  });
});
