/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  type LexicalEditor,
} from "lexical";
import {
  detectEditorDomDivergence,
  registerEditorDomWatchdog,
} from "./editorDomWatchdog";

function createMountedEditor(): { editor: LexicalEditor; root: HTMLElement } {
  const root = document.createElement("div");
  root.contentEditable = "true";
  document.body.appendChild(root);

  const editor = createEditor({
    namespace: "watchdog-test",
    onError: (error) => {
      throw error;
    },
  });
  editor.setRootElement(root);

  return { editor, root };
}

function writeParagraph(editor: LexicalEditor, text: string): void {
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(text));
      $getRoot().clear().append(paragraph);
    },
    { discrete: true },
  );
}

const flushSettle = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe("editor DOM watchdog", () => {
  it("reports parity for reconciler-driven content", () => {
    const { editor, root } = createMountedEditor();
    writeParagraph(editor, "Hello world");

    expect(root.textContent).toContain("Hello world");
    expect(detectEditorDomDivergence(editor)).toBeNull();
  });

  it("detects text present on screen but absent from the model", () => {
    const { editor, root } = createMountedEditor();
    writeParagraph(editor, "Hello");

    // An external writer (execCommand, a browser extension) appends straight
    // into the DOM; the reconciler never sees it.
    root.querySelector("p, div, span")?.appendChild(
      document.createTextNode(" INJECTED"),
    );

    const divergence = detectEditorDomDivergence(editor);
    expect(divergence).not.toBeNull();
    expect(divergence?.domText).toContain("INJECTED");
    expect(divergence?.modelText).not.toContain("INJECTED");
  });

  /**
   * jsdom's Lexical instance reverts foreign node insertions through its own
   * mutation observer before a settle window elapses, so the persistent
   * divergence a real browser exhibits (execCommand text that stays visible)
   * cannot be reproduced literally here. To exercise the watchdog's
   * observe→settle→report pipeline deterministically, the watchdog is handed
   * a proxy whose root element Lexical does not manage while the model reads
   * still come from the real editor.
   */
  function createProxiedWatchdogTarget(): {
    editor: LexicalEditor;
    surface: HTMLElement;
  } {
    const { editor } = createMountedEditor();
    writeParagraph(editor, "Hello");

    const surface = document.createElement("div");
    surface.textContent = "Hello";
    document.body.appendChild(surface);

    const proxy = {
      registerRootListener: (
        listener: (next: HTMLElement | null, previous: HTMLElement | null) => void,
      ) => {
        listener(surface, null);
        return () => {
          listener(null, surface);
        };
      },
      getRootElement: () => surface,
      isComposing: () => false,
      getEditorState: () => editor.getEditorState(),
    } as unknown as LexicalEditor;

    return { editor: proxy, surface };
  }

  it("fires onDesync once per divergent state after mutations settle", async () => {
    const { editor, surface } = createProxiedWatchdogTarget();

    const onDesync = vi.fn();
    const unregister = registerEditorDomWatchdog(editor, onDesync, {
      settleMs: 10,
    });

    // Matching content: mutations that keep parity never report.
    surface.appendChild(document.createTextNode(""));
    await flushSettle(40);
    expect(onDesync).not.toHaveBeenCalled();

    // A write the reconciler never registered reports — exactly once.
    surface.appendChild(document.createTextNode(" INJECTED"));
    await flushSettle(40);
    expect(onDesync).toHaveBeenCalledTimes(1);
    expect(onDesync.mock.calls[0]?.[0].domText).toContain("INJECTED");
    expect(onDesync.mock.calls[0]?.[0].modelText).not.toContain("INJECTED");

    // The same divergent state is not re-reported on later mutations.
    surface.appendChild(document.createTextNode(""));
    await flushSettle(40);
    expect(onDesync).toHaveBeenCalledTimes(1);

    unregister();
  });

  it("stops observing after unregister", async () => {
    const { editor, surface } = createProxiedWatchdogTarget();

    const onDesync = vi.fn();
    const unregister = registerEditorDomWatchdog(editor, onDesync, {
      settleMs: 10,
    });
    unregister();

    surface.appendChild(document.createTextNode(" INJECTED"));
    await flushSettle(40);
    expect(onDesync).not.toHaveBeenCalled();
  });
});
