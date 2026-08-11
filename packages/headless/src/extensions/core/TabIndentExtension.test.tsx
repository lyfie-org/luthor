/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { createEditor, KEY_TAB_COMMAND, type LexicalEditor } from "lexical";
import { TabIndentExtension } from "./TabIndentExtension";

function createMountedEditor(): {
  editor: LexicalEditor;
  root: HTMLElement;
  cleanup: () => void;
} {
  const root = document.createElement("div");
  root.contentEditable = "true";
  document.body.appendChild(root);

  const editor = createEditor({
    namespace: "tab-indent-test",
    onError: (error) => {
      throw error;
    },
  });
  editor.setRootElement(root);

  const extension = new TabIndentExtension();
  const unregister = extension.register(editor);

  return {
    editor,
    root,
    cleanup: () => {
      unregister();
      root.remove();
    },
  };
}

function pressKey(root: HTMLElement, key: string): void {
  root.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
}

function dispatchTab(editor: LexicalEditor): {
  handled: boolean;
  defaultPrevented: boolean;
} {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
  });
  const handled = editor.dispatchCommand(KEY_TAB_COMMAND, event);
  return { handled, defaultPrevented: event.defaultPrevented };
}

describe("TabIndentExtension focus escape (Esc then Tab)", () => {
  it("lets an Escape-armed Tab fall through to native focus navigation", () => {
    const { editor, root, cleanup } = createMountedEditor();
    try {
      pressKey(root, "Escape");

      const result = dispatchTab(editor);
      // The escape hatch claims the command so nothing indents, but leaves the
      // event's default alone so the browser moves focus out of the editor.
      expect(result.handled).toBe(true);
      expect(result.defaultPrevented).toBe(false);
    } finally {
      cleanup();
    }
  });

  it("arms for a single Tab only", () => {
    const { editor, root, cleanup } = createMountedEditor();
    try {
      pressKey(root, "Escape");

      expect(dispatchTab(editor).defaultPrevented).toBe(false);
      // The second Tab is back to normal capture: with no selection the
      // indent handler declines, and the escape hatch stays disarmed.
      expect(dispatchTab(editor).handled).toBe(false);
    } finally {
      cleanup();
    }
  });

  it("disarms when any other key is pressed after Escape", () => {
    const { editor, root, cleanup } = createMountedEditor();
    try {
      pressKey(root, "Escape");
      pressKey(root, "a");

      // Tab capture is restored — the hatch does not claim the command.
      expect(dispatchTab(editor).handled).toBe(false);
    } finally {
      cleanup();
    }
  });

  it("disarms when focus leaves the editor", () => {
    const { editor, root, cleanup } = createMountedEditor();
    try {
      pressKey(root, "Escape");
      root.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));

      expect(dispatchTab(editor).handled).toBe(false);
    } finally {
      cleanup();
    }
  });
});
