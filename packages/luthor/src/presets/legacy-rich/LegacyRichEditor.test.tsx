import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { extensiveEditorMock } = vi.hoisted(() => ({
  extensiveEditorMock: vi.fn(() => null),
}));

vi.mock("../extensive", () => ({
  ExtensiveEditor: extensiveEditorMock,
}));

import { LegacyRichEditor } from "./LegacyRichEditor";

describe("LegacyRichEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses visual-only, visual, markdown, and html mode set by default", () => {
    render(<LegacyRichEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      availableModes?: string[];
      initialMode?: string;
      isListStyleDropdownEnabled?: boolean;
    };
    expect(props.availableModes).toEqual(["visual-only", "visual", "markdown", "html"]);
    expect(props.initialMode).toBe("visual");
    expect(props.isListStyleDropdownEnabled).toBe(false);
  });

  it("switches to html mode set when sourceFormat is html", () => {
    render(<LegacyRichEditor showDefaultContent={false} sourceFormat="html" defaultEditorView="html" />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      availableModes?: string[];
      initialMode?: string;
    };
    expect(props.availableModes).toEqual(["visual-only", "visual", "json", "html"]);
    expect(props.initialMode).toBe("html");
  });

  it("enables table and image support in the default metadata-free profile", () => {
    render(<LegacyRichEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
    };

    expect(props.featureFlags).toEqual(
      expect.objectContaining({
        table: true,
        image: true,
        tabIndent: true,
      }),
    );
  });

  it("keeps non-core rich features disabled while preserving list indentation controls", () => {
    render(
      <LegacyRichEditor
        showDefaultContent={false}
        featureFlags={{
          table: false,
          image: false,
          iframeEmbed: true,
          youTubeEmbed: true,
          customNode: true,
          draggableBlock: true,
          tabIndent: false,
          themeToggle: true,
        }}
      />,
    );

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
      sourceMetadataMode?: string;
      toolbarLayout?: { sections?: Array<{ items?: string[] }> };
    };

    expect(props.featureFlags).toEqual(
      expect.objectContaining({
        table: false,
        image: false,
        iframeEmbed: false,
        youTubeEmbed: false,
        customNode: false,
        draggableBlock: false,
        tabIndent: true,
        themeToggle: false,
      }),
    );
    expect(props.sourceMetadataMode).toBe("none");
    expect(
      props.toolbarLayout?.sections?.some((section) =>
        (section.items ?? []).includes("indentList") ||
        (section.items ?? []).includes("outdentList"),
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
  });
});
