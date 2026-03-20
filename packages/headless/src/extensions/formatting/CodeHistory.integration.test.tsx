/* @vitest-environment jsdom */

import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  historyExtension,
  codeExtension,
  codeIntelligenceExtension,
  blockFormatExtension,
  listExtension,
  linkExtension,
  type Extension,
} from "@lyfie/luthor-headless";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";

type HarnessApi = {
  commands: {
    toggleCodeBlock?: () => void;
    toggleQuote?: () => void;
    undo?: () => void;
    redo?: () => void;
  };
  lexical: {
    update: (updater: () => void) => void;
  };
  export: {
    toJSON: () => unknown;
  };
};

function TestEditor({
  extensions,
  onReady,
}: {
  extensions: readonly Extension[];
  onReady: (api: HarnessApi) => void;
}) {
  const { Provider, useEditor } = createEditorSystem<typeof extensions>();

  function Capture() {
    const api = useEditor();

    useEffect(() => {
      onReady(api as unknown as HarnessApi);
    }, [api]);

    return <RichText placeholder="Type here" />;
  }

  return (
    <Provider extensions={extensions}>
      <Capture />
    </Provider>
  );
}

function getFirstNodeType(api: HarnessApi): string | null {
  const documentJson = api.export.toJSON() as {
    root?: {
      children?: Array<{ type?: string }>;
    };
  };

  return documentJson.root?.children?.[0]?.type ?? null;
}

function createEmptyClientRect(): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

async function assertCodeBlockUndoRedo({
  extensions,
  initialText,
}: {
  extensions: readonly Extension[];
  initialText: string;
}) {
  let api: HarnessApi | null = null;

  render(
    <TestEditor
      extensions={extensions}
      onReady={(nextApi) => {
        api = nextApi;
      }}
    />,
  );

  await waitFor(() => {
    expect(api).not.toBeNull();
  });

  const editorApi = api as HarnessApi;

  await act(async () => {
    editorApi.lexical.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();

      if (initialText.length > 0) {
        paragraph.append($createTextNode(initialText));
      }

      root.append(paragraph);
      paragraph.selectStart();
    });
  });

  await waitFor(() => {
    expect(getFirstNodeType(editorApi)).toBe("paragraph");
  });

  await act(async () => {
    editorApi.commands.toggleCodeBlock?.();
  });

  await waitFor(() => {
    expect(getFirstNodeType(editorApi)).toBe("code");
  });

  await act(async () => {
    editorApi.commands.undo?.();
  });

  await waitFor(() => {
    expect(getFirstNodeType(editorApi)).toBe("paragraph");
  });

  await act(async () => {
    editorApi.commands.redo?.();
  });

  await waitFor(() => {
    expect(getFirstNodeType(editorApi)).toBe("code");
  });
}

describe("Code block history integration", () => {
  beforeAll(() => {
    if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.getBoundingClientRect) {
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: () => createEmptyClientRect(),
      });
    }

    if (typeof Text !== "undefined" && !(Text.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect) {
      Object.defineProperty(Text.prototype, "getBoundingClientRect", {
        configurable: true,
        value: () => createEmptyClientRect(),
      });
    }

    if (typeof Range !== "undefined" && !Range.prototype.getBoundingClientRect) {
      Object.defineProperty(Range.prototype, "getBoundingClientRect", {
        configurable: true,
        value: () => createEmptyClientRect(),
      });
    }
  });

  it("supports undo/redo for code block toggles with code + history extensions", async () => {
    await assertCodeBlockUndoRedo({
      extensions: [
        richTextExtension,
        historyExtension,
        codeExtension,
        blockFormatExtension,
        listExtension,
        linkExtension,
      ],
      initialText: "const x = 1;",
    });
  });

  it("supports undo/redo for code block toggles with code intelligence enabled", async () => {
    await assertCodeBlockUndoRedo({
      extensions: [
        richTextExtension,
        historyExtension,
        codeExtension,
        blockFormatExtension,
        listExtension,
        linkExtension,
        codeIntelligenceExtension,
      ],
      initialText: "const y = 2;",
    });
  });

  it("supports undo/redo for code block toggles on an empty paragraph", async () => {
    await assertCodeBlockUndoRedo({
      extensions: [
        richTextExtension,
        historyExtension,
        codeExtension,
        blockFormatExtension,
        listExtension,
        linkExtension,
        codeIntelligenceExtension,
      ],
      initialText: "",
    });
  });

  it("keeps undo/redo working for non-code block commands when code intelligence is enabled", async () => {
    let api: HarnessApi | null = null;

    const extensions = [
      richTextExtension,
      historyExtension,
      codeExtension,
      blockFormatExtension,
      listExtension,
      linkExtension,
      codeIntelligenceExtension,
    ] as const;

    render(
      <TestEditor
        extensions={extensions}
        onReady={(nextApi) => {
          api = nextApi;
        }}
      />,
    );

    await waitFor(() => {
      expect(api).not.toBeNull();
    });

    const editorApi = api as HarnessApi;

    await act(async () => {
      editorApi.lexical.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode("quote me"));
        root.append(paragraph);
        paragraph.selectStart();
      });
    });

    await waitFor(() => {
      expect(getFirstNodeType(editorApi)).toBe("paragraph");
    });

    await act(async () => {
      editorApi.commands.toggleQuote?.();
    });

    await waitFor(() => {
      expect(getFirstNodeType(editorApi)).toBe("quote");
    });

    await act(async () => {
      editorApi.commands.undo?.();
    });

    await waitFor(() => {
      expect(getFirstNodeType(editorApi)).toBe("paragraph");
    });

    await act(async () => {
      editorApi.commands.redo?.();
    });

    await waitFor(() => {
      expect(getFirstNodeType(editorApi)).toBe("quote");
    });
  });

});
