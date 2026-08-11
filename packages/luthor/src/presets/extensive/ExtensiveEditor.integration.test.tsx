/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Integration tests against the real headless runtime (no mocks): a real
 * Lexical editor mounted in jsdom, driven through real DOM events. These are
 * the tests that would have caught Papyra's silent-autosave data loss: a
 * simulated user keystroke must produce a change notification, and a host
 * must be able to baseline `getMarkdown()` synchronously inside `onReady`.
 */

import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Lexical feature-detects `InputEvent.getTargetRanges` at import time and only
// attaches its `beforeinput` pipeline when it exists. jsdom implements
// InputEvent but not getTargetRanges, so polyfill it before lexical loads —
// otherwise simulated keystrokes never reach the editor.
vi.hoisted(() => {
  const win = globalThis as {
    InputEvent?: { prototype: { getTargetRanges?: () => StaticRange[] } };
  };
  if (win.InputEvent && !win.InputEvent.prototype.getTargetRanges) {
    win.InputEvent.prototype.getTargetRanges = () => [];
  }
});

import { $getRoot } from "lexical";
import {
  ExtensiveEditor,
  type ExtensiveEditorProps,
  type ExtensiveEditorRef,
} from "./ExtensiveEditor";

async function mountEditor(props: Partial<ExtensiveEditorProps> = {}) {
  let methods: ExtensiveEditorRef | null = null;
  const { onReady: hostOnReady, ...rest } = props;

  const utils = render(
    <ExtensiveEditor
      showDefaultContent={false}
      isToolbarEnabled={false}
      isEditorViewTabsVisible={false}
      availableModes={["visual-editor"]}
      onReady={(m) => {
        methods = m;
        hostOnReady?.(m);
      }}
      {...rest}
    />,
  );

  await waitFor(() => {
    expect(methods).not.toBeNull();
  });

  const editable = utils.container.querySelector<HTMLElement>(
    '[contenteditable="true"]',
  );
  expect(editable).not.toBeNull();

  return { methods: methods as unknown as ExtensiveEditorRef, editable: editable as HTMLElement, ...utils };
}

/**
 * Drive a character into the editor the way a browser does: a cancelable
 * `beforeinput` event with `inputType: "insertText"` on the contenteditable.
 * No direct model manipulation — Lexical's own event pipeline handles it.
 */
function typeCharacter(editable: HTMLElement, character: string) {
  editable.dispatchEvent(
    new InputEvent("beforeinput", {
      inputType: "insertText",
      data: character,
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe("ExtensiveEditor integration (real Lexical)", () => {
  it("produces exactly one source:'user' onChange for a typed character", async () => {
    const onChange = vi.fn();
    const { methods, editable } = await mountEditor({ onChange });

    const editor = methods.getLexicalEditor();
    expect(editor).not.toBeNull();

    // Place the caret (jsdom cannot focus a contenteditable, so the
    // selection is seeded directly); the keystroke itself then arrives as a
    // real DOM event and flows through Lexical's own input pipeline.
    editor?.update(
      () => {
        $getRoot().selectEnd();
      },
      { discrete: true },
    );

    typeCharacter(editable, "H");

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });
    const payload = onChange.mock.calls[0]?.[0];
    expect(payload.source).toBe("user");
    expect(payload.isDirty).toBe(true);
    expect(payload.markdown).toContain("H");

    // Exactly one call — no double-fire from the same commit.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("never fires onChange for the initial defaultContent load", async () => {
    const onChange = vi.fn();
    await mountEditor({ onChange, defaultContent: "Hello world" });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("lets a host baseline getMarkdown synchronously inside onReady, with no settle timer", async () => {
    let readyMarkdown: string | null = null;

    const { methods } = await mountEditor({
      defaultContent: "Hello world",
      onReady: (m) => {
        readyMarkdown = m.getMarkdown();
      },
    });

    // The content injected from defaultContent is already reconciled when
    // onReady runs: the snapshot contains the body…
    expect(readyMarkdown).toContain("Hello world");
    // …and is stable — later reads return the same string, so a host can use
    // it as its dirty-check baseline without an EDITOR_SETTLE_MS guess.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(methods.getMarkdown()).toBe(readyMarkdown);
  });

  it("keeps the typed character in getMarkdown (model and notification agree)", async () => {
    const onChange = vi.fn();
    const { methods, editable } = await mountEditor({ onChange });

    methods.getLexicalEditor()?.update(
      () => {
        $getRoot().selectEnd();
      },
      { discrete: true },
    );
    typeCharacter(editable, "Q");

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });
    expect(methods.getMarkdown()).toBe(
      (onChange.mock.calls[0]?.[0] as { markdown: string }).markdown,
    );
  });
});
