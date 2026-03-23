import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LexicalEditor } from "lexical";

const {
  getSelectionMock,
  isRangeSelectionMock,
  isCodeNodeMock,
} = vi.hoisted(() => ({
  getSelectionMock: vi.fn(),
  isRangeSelectionMock: vi.fn(),
  isCodeNodeMock: vi.fn((node: { __isCodeNode?: boolean }) => node?.__isCodeNode === true),
}));

vi.mock("lexical", () => ({
  $getSelection: () => getSelectionMock(),
  $isRangeSelection: (selection: unknown) => isRangeSelectionMock(selection),
  FORMAT_TEXT_COMMAND: "FORMAT_TEXT_COMMAND",
  INSERT_PARAGRAPH_COMMAND: "INSERT_PARAGRAPH_COMMAND",
  INSERT_LINE_BREAK_COMMAND: "INSERT_LINE_BREAK_COMMAND",
}));

vi.mock("@lexical/code", () => ({
  $isCodeNode: (node: unknown) => isCodeNodeMock(node as { __isCodeNode?: boolean }),
}));

import { CodeFormatExtension } from "./CodeFormatExtension";

type MockNode = {
  __isCodeNode?: boolean;
  getParent: () => MockNode | null;
};

function createEditor() {
  const dispatchCommand = vi.fn();

  return {
    dispatchCommand,
    getEditorState: () => ({
      read: (reader: () => void) => {
        reader();
      },
    }),
  };
}

describe("CodeFormatExtension", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks inline code toggle when the selection is inside a code block", () => {
    const codeNode: MockNode = {
      __isCodeNode: true,
      getParent: () => null,
    };
    const textNode: MockNode = {
      getParent: () => codeNode,
    };

    getSelectionMock.mockReturnValue({
      getNodes: () => [textNode],
    });
    isRangeSelectionMock.mockReturnValue(true);

    const editor = createEditor();
    const extension = new CodeFormatExtension();

    extension.getCommands(editor as unknown as LexicalEditor).toggleCode();

    expect(editor.dispatchCommand).not.toHaveBeenCalled();
  });

  it("allows inline code toggle when selection is outside code blocks", () => {
    const paragraphNode: MockNode = {
      getParent: () => null,
    };

    getSelectionMock.mockReturnValue({
      getNodes: () => [paragraphNode],
    });
    isRangeSelectionMock.mockReturnValue(true);

    const editor = createEditor();
    const extension = new CodeFormatExtension();

    extension.getCommands(editor as unknown as LexicalEditor).toggleCode();

    expect(editor.dispatchCommand).toHaveBeenCalledWith(
      "FORMAT_TEXT_COMMAND",
      "code",
    );
  });
});
