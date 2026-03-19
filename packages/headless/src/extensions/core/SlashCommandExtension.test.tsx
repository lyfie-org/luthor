/* @vitest-environment jsdom */

import type { LexicalEditor } from "lexical";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SlashCommandExtension } from "./SlashCommandExtension";

const lexicalMocks = vi.hoisted(() => ({
  getSelection: vi.fn(),
  isRangeSelection: vi.fn(),
  isTextNode: vi.fn(),
  getNodeByKey: vi.fn(),
}));

vi.mock("lexical", () => ({
  $getSelection: lexicalMocks.getSelection,
  $isRangeSelection: lexicalMocks.isRangeSelection,
  $isTextNode: lexicalMocks.isTextNode,
  $getNodeByKey: lexicalMocks.getNodeByKey,
}));

type TopLevelNodeMock = {
  getType: () => string;
};

type NodeMock = {
  getKey: () => string;
  getTextContent: () => string;
  getTopLevelElementOrThrow: () => TopLevelNodeMock;
  getPreviousSibling: () => NodeMock | null;
  getParent: () => TopLevelNodeMock;
};

function createTopLevelNode(type = "paragraph"): TopLevelNodeMock {
  return {
    getType: () => type,
  };
}

function createTextNode(options: {
  key: string;
  text: string;
  topLevel: TopLevelNodeMock;
  previousSibling?: NodeMock | null;
}): NodeMock {
  const previousSibling = options.previousSibling ?? null;
  return {
    getKey: () => options.key,
    getTextContent: () => options.text,
    getTopLevelElementOrThrow: () => options.topLevel,
    getPreviousSibling: () => previousSibling,
    getParent: () => options.topLevel,
  };
}

function createRangeSelection(options: {
  anchorNode: NodeMock;
  anchorOffset: number;
}) {
  return {
    __isRangeSelection: true,
    isCollapsed: () => true,
    anchor: {
      offset: options.anchorOffset,
      getNode: () => options.anchorNode,
    },
  };
}

function createEditorStub(): {
  editor: LexicalEditor;
  dispatchUpdate: () => void;
} {
  let updateListener: (() => void) | null = null;

  const editor = {
    registerUpdateListener: (listener: () => void) => {
      updateListener = listener;
      return () => {
        updateListener = null;
      };
    },
    getEditorState: () => ({
      read: (reader: () => void) => {
        reader();
      },
    }),
  } as unknown as LexicalEditor;

  return {
    editor,
    dispatchUpdate: () => {
      updateListener?.();
    },
  };
}

function mockCaretSelection() {
  const range = {
    cloneRange: () => ({
      collapse: vi.fn(),
      getBoundingClientRect: () => ({ left: 100, bottom: 200 }),
      getClientRects: () => [{ left: 100, bottom: 200 }],
    }),
  };

  vi.spyOn(window, "getSelection").mockReturnValue({
    rangeCount: 1,
    getRangeAt: () => range as unknown as Range,
  } as unknown as Selection);
}

describe("SlashCommandExtension trigger behavior", () => {
  beforeEach(() => {
    lexicalMocks.isRangeSelection.mockImplementation((value: unknown) => Boolean((value as { __isRangeSelection?: boolean })?.__isRangeSelection));
    lexicalMocks.isTextNode.mockReturnValue(true);
    mockCaretSelection();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    lexicalMocks.getSelection.mockReset();
    lexicalMocks.isRangeSelection.mockReset();
    lexicalMocks.isTextNode.mockReset();
    lexicalMocks.getNodeByKey.mockReset();
  });

  it("opens only when slash is at the start of a new line", () => {
    const extension = new SlashCommandExtension();
    const { editor, dispatchUpdate } = createEditorStub();
    const topLevel = createTopLevelNode();
    const anchorNode = createTextNode({
      key: "text-1",
      text: "/he",
      topLevel,
    });
    lexicalMocks.getSelection.mockReturnValue(
      createRangeSelection({
        anchorNode,
        anchorOffset: 3,
      }),
    );

    const states: Array<{ isOpen: boolean; query: string }> = [];
    const unsubscribe = extension.subscribe((state) => {
      states.push({ isOpen: state.isOpen, query: state.query });
    });
    const cleanup = extension.register(editor);

    dispatchUpdate();

    expect(states.at(-1)).toEqual({ isOpen: true, query: "he" });

    cleanup();
    unsubscribe();
  });

  it("does not open when slash appears after other characters in the same text node", () => {
    const extension = new SlashCommandExtension();
    const { editor, dispatchUpdate } = createEditorStub();
    const topLevel = createTopLevelNode();
    const anchorNode = createTextNode({
      key: "text-2",
      text: "hello /he",
      topLevel,
    });
    lexicalMocks.getSelection.mockReturnValue(
      createRangeSelection({
        anchorNode,
        anchorOffset: "hello /he".length,
      }),
    );

    const states: Array<{ isOpen: boolean }> = [];
    const unsubscribe = extension.subscribe((state) => {
      states.push({ isOpen: state.isOpen });
    });
    const cleanup = extension.register(editor);

    dispatchUpdate();

    expect(states.at(-1)).toEqual({ isOpen: false });

    cleanup();
    unsubscribe();
  });

  it("does not open when slash is in a split text node with prior sibling content on the same line", () => {
    const extension = new SlashCommandExtension();
    const { editor, dispatchUpdate } = createEditorStub();
    const topLevel = createTopLevelNode();
    const previousSibling = createTextNode({
      key: "text-prev",
      text: "hello ",
      topLevel,
    });
    const anchorNode = createTextNode({
      key: "text-3",
      text: "/he",
      topLevel,
      previousSibling,
    });
    lexicalMocks.getSelection.mockReturnValue(
      createRangeSelection({
        anchorNode,
        anchorOffset: 3,
      }),
    );

    const states: Array<{ isOpen: boolean }> = [];
    const unsubscribe = extension.subscribe((state) => {
      states.push({ isOpen: state.isOpen });
    });
    const cleanup = extension.register(editor);

    dispatchUpdate();

    expect(states.at(-1)).toEqual({ isOpen: false });

    cleanup();
    unsubscribe();
  });

  it("does not open when slash is prefixed by leading spaces", () => {
    const extension = new SlashCommandExtension();
    const { editor, dispatchUpdate } = createEditorStub();
    const topLevel = createTopLevelNode();
    const anchorNode = createTextNode({
      key: "text-4",
      text: "  /he",
      topLevel,
    });
    lexicalMocks.getSelection.mockReturnValue(
      createRangeSelection({
        anchorNode,
        anchorOffset: 5,
      }),
    );

    const states: Array<{ isOpen: boolean }> = [];
    const unsubscribe = extension.subscribe((state) => {
      states.push({ isOpen: state.isOpen });
    });
    const cleanup = extension.register(editor);

    dispatchUpdate();

    expect(states.at(-1)).toEqual({ isOpen: false });

    cleanup();
    unsubscribe();
  });
});
