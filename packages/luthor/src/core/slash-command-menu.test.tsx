import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SlashCommandMenu } from "./slash-command-menu";

function createRect({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function getMenuElement(): HTMLElement {
  return document.querySelector(".luthor-slash-menu") as HTMLElement;
}

describe("SlashCommandMenu", () => {
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect() {
      const element = this as HTMLElement;
      if (element.classList.contains("luthor-slash-menu")) {
        return createRect({ left: 0, top: 0, width: 420, height: 900 });
      }
      return createRect({ left: 0, top: 0, width: 0, height: 0 });
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it("keeps the menu visible while position updates during scroll", async () => {
    const rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    const commands = [{ id: "insert.paragraph", label: "Paragraph", action: () => {} }];
    const { rerender } = render(
      <SlashCommandMenu
        isOpen
        query=""
        position={{ x: 100, y: 120 }}
        commands={commands}
        onClose={() => {}}
        onExecute={() => {}}
      />,
    );

    expect(getMenuElement().style.visibility).toBe("hidden");

    const callbacks = [...rafQueue];
    rafQueue.length = 0;
    act(() => {
      callbacks.forEach((callback) => callback(0));
    });

    await waitFor(() => {
      expect(getMenuElement().style.visibility).toBe("visible");
    });

    rerender(
      <SlashCommandMenu
        isOpen
        query=""
        position={{ x: 140, y: 160 }}
        commands={commands}
        onClose={() => {}}
        onExecute={() => {}}
      />,
    );

    expect(getMenuElement().style.visibility).toBe("visible");
  });

  it("caps max-height to a viewport-aware standard limit", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500,
      writable: true,
    });

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    const commands = [{ id: "insert.heading", label: "Heading", action: () => {} }];
    render(
      <SlashCommandMenu
        isOpen
        query=""
        position={{ x: 100, y: 120 }}
        commands={commands}
        onClose={() => {}}
        onExecute={() => {}}
      />,
    );

    await waitFor(() => {
      expect(getMenuElement().style.maxHeight).toBe("250px");
    });
  });
});
