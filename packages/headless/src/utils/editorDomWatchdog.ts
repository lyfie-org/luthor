/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Model/DOM divergence watchdog.
 *
 * Lexical's model is the source of truth: serialization (`getMarkdown()` and
 * friends) reads the model, never the DOM. Text written into the
 * contenteditable behind the reconciler's back — `document.execCommand`,
 * browser extensions, password managers, translation tools, some IME edge
 * cases — renders on screen but never lands in the model, so it silently
 * disappears from every export. The watchdog turns that silence into a
 * callback: after external mutations settle it compares the visible text with
 * the model text and reports any mismatch.
 *
 * The comparison is whitespace-insensitive and skips decorator subtrees on
 * both sides (decorator React content is not model text), so ordinary edits
 * and custom embed nodes never produce false positives.
 */

import {
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";

/** A detected mismatch between the rendered text and the model text. */
export interface EditorDomDivergence {
  /** Normalized text currently visible in the contenteditable. */
  domText: string;
  /** Normalized text the Lexical model (and therefore serialization) holds. */
  modelText: string;
}

/** Options for {@link registerEditorDomWatchdog}. */
export interface EditorDomWatchdogOptions {
  /**
   * Quiet period (ms) after the last DOM mutation before the parity check
   * runs, so a burst of reconciler writes is compared once. Default: 120.
   */
  settleMs?: number;
}

const DEFAULT_SETTLE_MS = 120;

/** Collapse whitespace runs and strip zero-width characters for comparison. */
function normalizeComparableText(text: string): string {
  return text
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function $collectModelText(node: LexicalNode, out: string[]): void {
  // Decorator content is rendered by React and intentionally excluded from
  // the parity check (its DOM counterpart is skipped below).
  if ($isDecoratorNode(node)) {
    return;
  }

  if ($isTextNode(node)) {
    out.push(node.getTextContent());
    return;
  }

  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      $collectModelText(child, out);
    }
  }
}

/** Read the comparable model text of the current editor state. */
export function readEditorModelText(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => {
    const out: string[] = [];
    $collectModelText($getRoot(), out);
    return normalizeComparableText(out.join(" "));
  });
}

function isInsideDecorator(node: Node, root: HTMLElement): boolean {
  let current: Node | null = node.parentNode;
  while (current && current !== root) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute("data-lexical-decorator")
    ) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

/** Read the comparable visible text of a contenteditable root. */
export function readEditorDomText(root: HTMLElement): string {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out: string[] = [];

  for (
    let textNode = walker.nextNode();
    textNode !== null;
    textNode = walker.nextNode()
  ) {
    if (!isInsideDecorator(textNode, root)) {
      out.push(textNode.textContent ?? "");
    }
  }

  return normalizeComparableText(out.join(" "));
}

/**
 * Compare the rendered text of the editor's root element with its model text.
 * Returns the divergence, or `null` when they agree (or no root is mounted).
 */
export function detectEditorDomDivergence(
  editor: LexicalEditor,
): EditorDomDivergence | null {
  const root = editor.getRootElement();
  if (!root) {
    return null;
  }

  const domText = readEditorDomText(root);
  const modelText = readEditorModelText(editor);
  return domText === modelText ? null : { domText, modelText };
}

/**
 * Watch the editor's contenteditable for external DOM writes the reconciler
 * never registered, and report the resulting model/DOM divergence.
 *
 * Reconciler-driven mutations keep the two sides in agreement, so they pass
 * the parity check without needing to be told apart from external writes; any
 * mutation batch that leaves the DOM saying something the model does not is
 * reported once through `onDesync`. Checks are deferred by `settleMs` after
 * the last mutation and skipped mid-IME-composition to avoid transient
 * states. Returns an unregister function.
 */
export function registerEditorDomWatchdog(
  editor: LexicalEditor,
  onDesync: (divergence: EditorDomDivergence) => void,
  options: EditorDomWatchdogOptions = {},
): () => void {
  if (typeof MutationObserver === "undefined") {
    return () => {};
  }

  const settleMs = options.settleMs ?? DEFAULT_SETTLE_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastReportedDomText: string | null = null;
  let observer: MutationObserver | null = null;

  const check = () => {
    timer = undefined;
    if (editor.isComposing()) {
      return;
    }

    const divergence = detectEditorDomDivergence(editor);
    if (!divergence) {
      lastReportedDomText = null;
      return;
    }

    // Report each distinct divergent state once, not on every settle window.
    if (divergence.domText === lastReportedDomText) {
      return;
    }

    lastReportedDomText = divergence.domText;
    onDesync(divergence);
  };

  const schedule = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(check, settleMs);
  };

  const attach = (root: HTMLElement | null) => {
    observer?.disconnect();
    observer = null;
    if (!root) {
      return;
    }

    observer = new MutationObserver(schedule);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };

  const unregisterRootListener = editor.registerRootListener(
    (nextRoot: HTMLElement | null) => {
      attach(nextRoot);
    },
  );

  return () => {
    unregisterRootListener();
    observer?.disconnect();
    observer = null;
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  };
}
