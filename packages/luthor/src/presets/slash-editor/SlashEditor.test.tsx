import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { extensiveEditorMock } = vi.hoisted(() => ({
  extensiveEditorMock: vi.fn(() => null),
}));

vi.mock("../extensive", () => ({
  ExtensiveEditor: extensiveEditorMock,
}));

import { SlashEditor } from "./SlashEditor";

describe("SlashEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides toolbar by default and enables slash + draggable defaults", () => {
    render(<SlashEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      isToolbarEnabled?: boolean;
      availableModes?: string[];
      slashCommandVisibility?: { allowlist?: string[] };
      featureFlags?: Record<string, boolean>;
    };
    expect(props.isToolbarEnabled).toBe(false);
    expect(props.availableModes).toEqual(["visual", "json", "markdown", "html"]);
    expect(props.slashCommandVisibility?.allowlist).toEqual(
      expect.arrayContaining([
        "format.bold",
        "format.italic",
        "format.code",
        "block.heading1",
        "block.codeblock",
        "insert.table",
      ]),
    );

    const featureFlags = props.featureFlags ?? {};
    expect(featureFlags.slashCommand).toBe(true);
    expect(featureFlags.draggableBlock).toBe(true);
    expect(featureFlags.commandPalette).toBe(false);
    expect(featureFlags.image).toBe(false);
    expect(featureFlags.iframeEmbed).toBe(false);
  });

  it("allows disabling draggable blocks", () => {
    render(<SlashEditor showDefaultContent={false} isDraggableEnabled={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      featureFlags?: Record<string, boolean>;
    };
    const featureFlags = props.featureFlags ?? {};
    expect(featureFlags.draggableBlock).toBe(false);
  });

  it("accepts explicit slash visibility overrides", () => {
    render(
      <SlashEditor
        showDefaultContent={false}
        slashVisibility={{ allowlist: ["insert.table"], denylist: ["insert.table"] }}
      />,
    );

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      slashCommandVisibility?: unknown;
    };
    expect(props.slashCommandVisibility).toEqual({
      allowlist: ["insert.table"],
      denylist: ["insert.table"],
    });
  });
});
