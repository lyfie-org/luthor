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

  it("uses markdown mode set by default", () => {
    render(<LegacyRichEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      availableModes?: string[];
      initialMode?: string;
    };
    expect(props.availableModes).toEqual(["visual", "json", "markdown"]);
    expect(props.initialMode).toBe("visual");
  });

  it("switches to html mode set when sourceFormat is html", () => {
    render(<LegacyRichEditor showDefaultContent={false} sourceFormat="html" defaultEditorView="html" />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      availableModes?: string[];
      initialMode?: string;
    };
    expect(props.availableModes).toEqual(["visual", "json", "html"]);
    expect(props.initialMode).toBe("html");
  });

  it("keeps metadata-heavy features disabled even with overrides", () => {
    render(
      <LegacyRichEditor
        showDefaultContent={false}
        featureFlags={{
          table: true,
          image: true,
          iframeEmbed: true,
          youTubeEmbed: true,
          customNode: true,
          draggableBlock: true,
          themeToggle: true,
        }}
      />,
    );

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
    };

    expect(props.featureFlags).toEqual(
      expect.objectContaining({
        table: false,
        image: false,
        iframeEmbed: false,
        youTubeEmbed: false,
        customNode: false,
        draggableBlock: false,
        themeToggle: false,
      }),
    );
  });
});
