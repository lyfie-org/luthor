/* @vitest-environment jsdom */

import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { LexicalEditor } from "lexical";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeIntelligenceExtension } from "./CodeIntelligenceExtension";

let mockEditor: LexicalEditor;

vi.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [mockEditor],
}));

function createRect(top: number, left: number, width: number, height: number) {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function setupReadOnlyPluginHarness(
  initialEditable: boolean,
  language: string = "plaintext",
) {
  const richTextContainer = document.createElement("div");
  richTextContainer.className = "luthor-richtext-container";
  const root = document.createElement("div");
  root.className = "luthor-editor-root";
  const codeElement = document.createElement("pre");
  root.append(codeElement);
  richTextContainer.append(root);
  document.body.append(richTextContainer);

  Object.defineProperty(richTextContainer, "getBoundingClientRect", {
    configurable: true,
    value: () => createRect(0, 0, 640, 480),
  });

  Object.defineProperty(codeElement, "getBoundingClientRect", {
    configurable: true,
    value: () => createRect(72, 40, 420, 180),
  });

  const snapshot = {
    key: "code-node-1",
    language,
    text: "console.log('hello');",
  };

  const extension = new CodeIntelligenceExtension();
  vi.spyOn(extension, "getCodeBlocksSnapshot").mockReturnValue([snapshot]);
  vi.spyOn(extension, "getLanguageOptionsSnapshot").mockReturnValue([
    "plaintext",
    "typescript",
  ]);

  let editable = initialEditable;
  let editableListener: ((value: boolean) => void) | null = null;
  const registerEditableListener = vi.fn((listener: (value: boolean) => void) => {
    editableListener = listener;
    return () => {
      if (editableListener === listener) {
        editableListener = null;
      }
    };
  });

  mockEditor = {
    isEditable: () => editable,
    getRootElement: () => root,
    getElementByKey: (nodeKey: string) => (nodeKey === snapshot.key ? codeElement : null),
    registerUpdateListener: () => () => {},
    registerEditableListener,
  } as unknown as LexicalEditor;

  return {
    extension,
    setEditable(next: boolean) {
      editable = next;
      editableListener?.(next);
    },
  };
}

describe("CodeIntelligenceExtension read-only language controls", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("disables language dropdown while editor is non-editable", async () => {
    const { extension } = setupReadOnlyPluginHarness(false);

    render(<>{extension.getPlugins()}</>);

    const select = (await screen.findByLabelText("Code language")) as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it("enables language dropdown after editor returns to editable mode", async () => {
    const { extension, setEditable } = setupReadOnlyPluginHarness(false);

    render(<>{extension.getPlugins()}</>);

    const initialSelect = (await screen.findByLabelText("Code language")) as HTMLSelectElement;
    expect(initialSelect.disabled).toBe(true);

    act(() => {
      setEditable(true);
    });

    await waitFor(() => {
      const updatedSelect = screen.getByLabelText("Code language") as HTMLSelectElement;
      expect(updatedSelect.disabled).toBe(false);
    });
  });

  it("keeps unsupported language selected in dropdown", async () => {
    const { extension } = setupReadOnlyPluginHarness(true, "bash");

    render(<>{extension.getPlugins()}</>);

    const select = (await screen.findByLabelText("Code language")) as HTMLSelectElement;
    expect(select.value).toBe("bash");
    expect(screen.getByRole("option", { name: "Bash" })).toBeInTheDocument();
  });
});
