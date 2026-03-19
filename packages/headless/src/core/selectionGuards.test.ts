import { beforeEach, describe, expect, it, vi } from "vitest";
import { $getSelection, $isRangeSelection } from "lexical";
import { isSelectionInsideCodeBlock } from "./selectionGuards";

vi.mock("lexical", () => ({
  $getSelection: vi.fn(),
  $isRangeSelection: vi.fn(),
}));

type FakeLexicalNode = {
  getType: () => string;
  getParent: () => FakeLexicalNode | null;
};

function createNode(type: string, parent: FakeLexicalNode | null = null): FakeLexicalNode {
  return {
    getType: () => type,
    getParent: () => parent,
  };
}

describe("isSelectionInsideCodeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when anchor selection is inside a code block", () => {
    const codeNode = createNode("code");
    const textNode = createNode("text", codeNode);
    const rangeSelection = {
      anchor: { getNode: () => textNode },
      focus: { getNode: () => textNode },
    };

    vi.mocked($getSelection).mockReturnValue(rangeSelection as never);
    vi.mocked($isRangeSelection).mockReturnValue(true);

    expect(isSelectionInsideCodeBlock()).toBe(true);
  });

  it("returns false for selection inside table cells (no code block ancestor)", () => {
    const tableNode = createNode("table");
    const tableRowNode = createNode("tablerow", tableNode);
    const tableCellNode = createNode("tablecell", tableRowNode);
    const paragraphNode = createNode("paragraph", tableCellNode);
    const textNode = createNode("text", paragraphNode);
    const rangeSelection = {
      anchor: { getNode: () => textNode },
      focus: { getNode: () => textNode },
    };

    vi.mocked($getSelection).mockReturnValue(rangeSelection as never);
    vi.mocked($isRangeSelection).mockReturnValue(true);

    expect(isSelectionInsideCodeBlock()).toBe(false);
  });

  it("returns false when selection is not a range selection", () => {
    vi.mocked($getSelection).mockReturnValue({} as never);
    vi.mocked($isRangeSelection).mockReturnValue(false);

    expect(isSelectionInsideCodeBlock()).toBe(false);
  });
});

