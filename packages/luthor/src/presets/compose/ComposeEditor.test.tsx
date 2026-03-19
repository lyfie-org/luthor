import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { extensiveEditorMock } = vi.hoisted(() => ({
  extensiveEditorMock: vi.fn(() => null),
}));

vi.mock("../extensive", () => ({
  ExtensiveEditor: extensiveEditorMock,
}));

import { ComposeEditor } from "./ComposeEditor";

describe("ComposeEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables inline features and disables advanced media by default", () => {
    render(<ComposeEditor showDefaultContent={false} />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    const featureFlags = props.featureFlags as Record<string, boolean>;
    expect(props.availableModes).toEqual(["visual-only", "visual", "json"]);
    expect(props.sourceMetadataMode).toBeUndefined();
    expect(featureFlags.bold).toBe(true);
    expect(featureFlags.italic).toBe(true);
    expect(featureFlags.list).toBe(true);
    expect(featureFlags.code).toBe(true);
    expect(featureFlags.codeIntelligence).toBe(true);
    expect(featureFlags.image).toBe(false);
    expect(featureFlags.table).toBe(false);
  });

  it("applies compact toolbar class path", () => {
    render(<ComposeEditor showDefaultContent={false} compactToolbar />);

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(props.variantClassName).toContain("luthor-preset-compose--compact");
    expect(props.toolbarClassName).toContain("luthor-preset-compose__toolbar--compact");
  });

  it("forwards line number visibility to underlying editor", () => {
    render(
      <ComposeEditor
        showDefaultContent={false}
        showLineNumbers={false}
      />,
    );

    const props = extensiveEditorMock.mock.calls.at(-1)?.[0] as {
      showLineNumbers?: boolean;
    };
    expect(props.showLineNumbers).toBe(false);
  });
});
