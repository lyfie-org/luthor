/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorContext } from "../../core/createEditorSystem";
import { RichText } from "./RichTextExtension";

vi.mock("@lexical/react/LexicalRichTextPlugin", () => ({
  RichTextPlugin: ({
    contentEditable,
    placeholder,
  }: {
    contentEditable: React.ReactElement;
    placeholder: React.ReactElement;
  }) => (
    <div data-testid="richtext-plugin">
      {contentEditable}
      {placeholder}
    </div>
  ),
}));

vi.mock("@lexical/react/LexicalContentEditable", () => ({
  ContentEditable: ({
    className,
    style,
  }: {
    className?: string;
    style?: React.CSSProperties;
  }) => <div data-testid="content-editable" contentEditable className={className} style={style} />,
}));

describe("RichText placeholder behavior", () => {
  it("renders custom placeholder text for empty state with default placeholder class", () => {
    render(<RichText placeholder="Draft here..." />);

    const placeholder = screen.getByText("Draft here...");
    expect(placeholder).toHaveClass("luthor-placeholder");
  });

  it("falls back to provider config placeholder when placeholder prop is not set", () => {
    render(
      <EditorContext.Provider value={{ config: { placeholder: "Config placeholder" } } as any}>
        <RichText />
      </EditorContext.Provider>,
    );

    expect(screen.getByText("Config placeholder")).toBeInTheDocument();
  });

  it("does not force top/left/color inline placeholder styles by default", () => {
    render(<RichText placeholder="Theme controlled" />);

    const placeholder = screen.getByText("Theme controlled");
    const style = placeholder.getAttribute("style") ?? "";
    expect(style).not.toContain("top");
    expect(style).not.toContain("left");
    expect(style).not.toContain("color");
  });

  it("uses text cursor on container and places caret to nearest line when clicking outside editable", () => {
    const getSelectionSpy = vi.spyOn(window, "getSelection").mockReturnValue({
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    } as unknown as Selection);

    const offsetNode = document.createTextNode("line 2");
    const caretPositionFromPointMock = vi.fn(() => ({
      offsetNode,
      offset: 0,
    }));
    const originalCaretPositionFromPoint = (
      document as Document & {
        caretPositionFromPoint?: unknown;
      }
    ).caretPositionFromPoint;
    Object.defineProperty(document, "caretPositionFromPoint", {
      configurable: true,
      value: caretPositionFromPointMock,
    });

    const { container } = render(<RichText placeholder="Nearest line" />);
    const root = container.querySelector(".luthor-editor-container") as HTMLElement;
    const editable = screen.getByTestId("content-editable") as HTMLElement;
    const line1 = document.createElement("p");
    const line2 = document.createElement("p");
    line2.append(offsetNode);
    editable.append(line1, line2);

    Object.defineProperty(editable, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        right: 400,
      }),
    });
    Object.defineProperty(line1, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        top: 10,
        bottom: 30,
        height: 20,
      }),
    });
    Object.defineProperty(line2, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        top: 60,
        bottom: 90,
        height: 30,
      }),
    });

    expect(root.style.cursor).toBe("text");

    fireEvent.mouseDown(root, { button: 0, clientX: 50, clientY: 70 });

    expect(caretPositionFromPointMock).toHaveBeenCalledWith(50, 70);

    getSelectionSpy.mockRestore();
    Object.defineProperty(document, "caretPositionFromPoint", {
      configurable: true,
      value: originalCaretPositionFromPoint,
    });
  });

  it("supports nonEditableVisualMode and unlocks editing on click with caret placement", () => {
    const setEditableSpy = vi.fn();
    const getSelectionSpy = vi.spyOn(window, "getSelection").mockReturnValue({
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    } as unknown as Selection);
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });

    const offsetNode = document.createTextNode("line 2");
    const caretPositionFromPointMock = vi.fn(() => ({
      offsetNode,
      offset: 0,
    }));
    const originalCaretPositionFromPoint = (
      document as Document & {
        caretPositionFromPoint?: unknown;
      }
    ).caretPositionFromPoint;
    Object.defineProperty(document, "caretPositionFromPoint", {
      configurable: true,
      value: caretPositionFromPointMock,
    });

    const { container } = render(
      <EditorContext.Provider
        value={
          {
            config: {},
            lexical: {
              setEditable: setEditableSpy,
            },
          } as any
        }
      >
        <RichText placeholder="Locked visual mode" nonEditableVisualMode />
      </EditorContext.Provider>,
    );
    const root = container.querySelector(".luthor-editor-container") as HTMLElement;
    const editable = screen.getByTestId("content-editable") as HTMLElement;
    const line1 = document.createElement("p");
    const line2 = document.createElement("p");
    line2.append(offsetNode);
    editable.append(line1, line2);

    Object.defineProperty(editable, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        right: 400,
      }),
    });
    Object.defineProperty(line1, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        top: 10,
        bottom: 30,
        height: 20,
      }),
    });
    Object.defineProperty(line2, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        top: 60,
        bottom: 90,
        height: 30,
      }),
    });

    expect(setEditableSpy).toHaveBeenCalledWith(false);
    expect(root.style.cursor).toBe("default");
    expect(editable.style.cursor).toBe("default");
    expect(editable.style.caretColor).toBe("transparent");
    expect(editable.style.userSelect).toBe("text");

    fireEvent.mouseDown(root, { button: 0, clientX: 70, clientY: 75 });

    expect(setEditableSpy).toHaveBeenCalledWith(true);
    expect(caretPositionFromPointMock).toHaveBeenCalledWith(70, 75);

    getSelectionSpy.mockRestore();
    requestAnimationFrameSpy.mockRestore();
    Object.defineProperty(document, "caretPositionFromPoint", {
      configurable: true,
      value: originalCaretPositionFromPoint,
    });
  });

  it("invokes onEditIntent from non-editable mode without enabling edit state locally", () => {
    const setEditableSpy = vi.fn();
    const onEditIntent = vi.fn();

    const { container } = render(
      <EditorContext.Provider
        value={
          {
            config: {},
            lexical: {
              setEditable: setEditableSpy,
            },
          } as any
        }
      >
        <RichText
          placeholder="Read mode"
          nonEditableVisualMode
          onEditIntent={onEditIntent}
        />
      </EditorContext.Provider>,
    );

    const root = container.querySelector(".luthor-editor-container") as HTMLElement;

    fireEvent.mouseDown(root, { button: 0, clientX: 120, clientY: 240 });
    fireEvent.mouseUp(root, { button: 0, clientX: 120, clientY: 240 });

    expect(onEditIntent).toHaveBeenCalledWith({ clientX: 120, clientY: 240 });
    expect(setEditableSpy).toHaveBeenCalledTimes(1);
    expect(setEditableSpy).toHaveBeenCalledWith(false);
  });

  it("keeps iframe-like embed targets interactive in non-editable mode", () => {
    const onEditIntent = vi.fn();

    const { container } = render(
      <EditorContext.Provider
        value={
          {
            config: {},
            lexical: {
              setEditable: vi.fn(),
            },
          } as any
        }
      >
        <RichText
          placeholder="Read mode"
          nonEditableVisualMode
          onEditIntent={onEditIntent}
        />
      </EditorContext.Provider>,
    );

    const root = container.querySelector(".luthor-editor-container") as HTMLElement;
    const editable = screen.getByTestId("content-editable") as HTMLElement;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Embed");
    editable.append(iframe);

    fireEvent.mouseDown(iframe, { button: 0, clientX: 88, clientY: 144 });
    fireEvent.mouseUp(iframe, { button: 0, clientX: 88, clientY: 144 });

    expect(onEditIntent).not.toHaveBeenCalled();
    expect(root.style.cursor).toBe("default");
  });

  it("keeps checklist checkbox targets interactive in non-editable mode", () => {
    const onEditIntent = vi.fn();

    const { container } = render(
      <EditorContext.Provider
        value={
          {
            config: {},
            lexical: {
              setEditable: vi.fn(),
            },
          } as any
        }
      >
        <RichText
          placeholder="Read mode"
          nonEditableVisualMode
          onEditIntent={onEditIntent}
        />
      </EditorContext.Provider>,
    );

    const editable = screen.getByTestId("content-editable") as HTMLElement;
    const checklist = document.createElement("ul");
    const listItem = document.createElement("li");
    listItem.setAttribute("role", "checkbox");
    listItem.setAttribute("aria-checked", "false");
    checklist.append(listItem);
    editable.append(checklist);

    fireEvent.mouseDown(listItem, { button: 0, clientX: 32, clientY: 24 });
    fireEvent.mouseUp(listItem, { button: 0, clientX: 32, clientY: 24 });

    expect(onEditIntent).not.toHaveBeenCalled();
    expect(container.querySelector(".luthor-editor-container")?.style.cursor).toBe(
      "default",
    );
  });

  it("does not invoke onEditIntent when selecting text in non-editable mode", () => {
    const onEditIntent = vi.fn();
    const getSelectionSpy = vi.spyOn(window, "getSelection").mockReturnValue({
      isCollapsed: false,
      rangeCount: 1,
      toString: () => "selected",
    } as unknown as Selection);

    const { container } = render(
      <EditorContext.Provider
        value={
          {
            config: {},
            lexical: {
              setEditable: vi.fn(),
            },
          } as any
        }
      >
        <RichText
          placeholder="Read mode"
          nonEditableVisualMode
          onEditIntent={onEditIntent}
        />
      </EditorContext.Provider>,
    );

    const root = container.querySelector(".luthor-editor-container") as HTMLElement;
    fireEvent.mouseDown(root, { button: 0, clientX: 24, clientY: 48 });
    fireEvent.mouseUp(root, { button: 0, clientX: 28, clientY: 60 });

    expect(onEditIntent).not.toHaveBeenCalled();
    getSelectionSpy.mockRestore();
  });
});
