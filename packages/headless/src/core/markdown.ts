import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { QuoteNode, HeadingNode } from "@lexical/rich-text";
import { CodeNode } from "@lexical/code";
import {
  createEditor,
  ParagraphNode,
  TextNode,
  LineBreakNode,
  TabNode,
  type EditorState,
} from "lexical";

export type JsonDocument = {
  root: Record<string, unknown>;
};

function createMarkdownEditor() {
  return createEditor({
    namespace: "luthor-markdown-converter",
    onError: (error) => {
      throw error;
    },
    nodes: [
      ParagraphNode,
      TextNode,
      LineBreakNode,
      TabNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      CodeNode,
    ],
  });
}

function toEditorState(editor: ReturnType<typeof createMarkdownEditor>, input: unknown): EditorState {
  const serialized = typeof input === "string" ? input : JSON.stringify(input ?? {});
  return editor.parseEditorState(serialized);
}

export function markdownToJSON(markdown: string): JsonDocument {
  const editor = createMarkdownEditor();
  editor.update(
    () => {
      $convertFromMarkdownString(markdown, TRANSFORMERS);
    },
    { discrete: true },
  );

  return editor.getEditorState().toJSON() as JsonDocument;
}

export function jsonToMarkdown(input: unknown): string {
  const editor = createMarkdownEditor();
  const editorState = toEditorState(editor, input);
  editor.setEditorState(editorState, { tag: "history-merge" });

  return editorState.read(() => {
    return $convertToMarkdownString(TRANSFORMERS);
  });
}
