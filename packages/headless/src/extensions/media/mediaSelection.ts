/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { useCallback, useSyncExternalStore } from "react";
import {
  $createNodeSelection,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";

/*
 * Which nodes are selected, as one shared store per editor.
 *
 * Every media embed needs to know whether it is the selected one. Giving each
 * its own update listener costs N listeners and N state updates per keystroke
 * (and each fired even when nothing about selection changed). Here one listener
 * per editor keeps the selected keys, and a component re-renders only when *its*
 * answer flips — via useSyncExternalStore, so there is no effect-then-setState
 * frame in which the old answer is shown.
 */

interface SelectionStore {
  keys: ReadonlySet<string>;
  editable: boolean;
  listeners: Set<() => void>;
}

const stores = new WeakMap<LexicalEditor, SelectionStore>();

function sameKeys(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const key of a) if (!b.has(key)) return false;
  return true;
}

function storeFor(editor: LexicalEditor): SelectionStore {
  const existing = stores.get(editor);
  if (existing) return existing;
  const created: SelectionStore = {
    keys: new Set(),
    editable: editor.isEditable(),
    listeners: new Set(),
  };
  stores.set(editor, created);
  const notify = () => created.listeners.forEach((listener) => listener());
  const read = () => {
    const next = new Set<string>();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isNodeSelection(selection)) {
        for (const node of selection.getNodes()) next.add(node.getKey());
      }
    });
    if (!sameKeys(created.keys, next)) {
      created.keys = next;
      notify();
    }
  };
  // The listeners live as long as the editor does (the store is keyed weakly
  // on it), so there is nothing to unregister.
  editor.registerUpdateListener(read);
  editor.registerEditableListener((editable) => {
    if (created.editable !== editable) {
      created.editable = editable;
      notify();
    }
  });
  read();
  return created;
}

const NO_EDITOR_SUBSCRIBE = () => () => {};

/** Whether the node with `key` is (part of) the editor's node selection. */
export function useIsNodeSelected(editor: LexicalEditor | null, key: string | undefined): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!editor) return () => {};
      const store = storeFor(editor);
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    [editor],
  );
  const read = useCallback(
    () => (editor && key ? storeFor(editor).keys.has(key) : false),
    [editor, key],
  );
  return useSyncExternalStore(editor ? subscribe : NO_EDITOR_SUBSCRIBE, read, read);
}

/** Whether the editor is editable, reactively (false without an editor). */
export function useIsEditable(editor: LexicalEditor | null): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!editor) return () => {};
      const store = storeFor(editor);
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    [editor],
  );
  const read = useCallback(() => (editor ? storeFor(editor).editable : false), [editor]);
  return useSyncExternalStore(editor ? subscribe : NO_EDITOR_SUBSCRIBE, read, read);
}

/**
 * Select a decorator node when it is clicked. Must be the click *command*, at a
 * priority above rich text's own handler — which clears any node selection on
 * every click, so selecting from a React onClick raced it and the selection
 * (and the node's toolbar) flickered. `anchorSelector` finds the clickable part
 * of the node's DOM.
 */
export function registerClickToSelect(
  editor: LexicalEditor,
  isNode: (node: LexicalNode | null) => boolean,
  anchorSelector = '[data-luthor-selection-anchor="true"]',
): () => void {
  return editor.registerCommand(
    CLICK_COMMAND,
    (event: MouseEvent) => {
      if (!editor.isEditable()) return false;
      const target = event.target;
      const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
      const anchor = element?.closest(anchorSelector);
      if (!anchor) return false;
      const node = $getNearestNodeFromDOMNode(anchor);
      if (!node || !isNode(node)) return false;
      const selection = $createNodeSelection();
      selection.add(node.getKey());
      $setSelection(selection);
      return true;
    },
    COMMAND_PRIORITY_LOW,
  );
}
