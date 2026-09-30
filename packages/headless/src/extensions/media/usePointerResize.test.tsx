/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePointerResize, type ResizeEdge } from "./usePointerResize";

// jsdom has no PointerEvent: without one, pointerId/clientX never arrive.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent = PointerEventPolyfill;
}

// jsdom has no layout: give the frame a width and run animation frames at once.
beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 1;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ width: 300, height: 200, top: 0, left: 0, right: 300, bottom: 200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect,
  );
});
afterEach(() => vi.restoreAllMocks());

function Harness(props: { onCommit: (w: number) => void; edge?: ResizeEdge; centered?: boolean; max?: number }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const { onPointerDown, resizing } = usePointerResize({
    frameRef,
    minWidth: 48,
    maxWidth: () => props.max ?? 800,
    centered: props.centered,
    onCommit: props.onCommit,
  });
  return (
    <div ref={frameRef} data-testid="frame" style={{ width: "min(300px, 100%)" }} data-resizing={resizing}>
      <span data-testid="handle" onPointerDown={onPointerDown(props.edge ?? "right")} />
    </div>
  );
}

function drag(handle: HTMLElement, fromX: number, toX: number) {
  fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: fromX });
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: toX });
}

describe("usePointerResize", () => {
  it("previews on the frame and commits once, on release", () => {
    const onCommit = vi.fn();
    const { getByTestId } = render(<Harness onCommit={onCommit} />);
    const handle = getByTestId("handle");
    drag(handle, 300, 400);
    expect(getByTestId("frame").style.width).toBe("400px");
    expect(getByTestId("frame").dataset.resizing).toBe("true");
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 400 });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(400);
    // The inline width goes back to React's value; the commit re-renders it.
    expect(getByTestId("frame").style.width).toBe("min(300px, 100%)");
    expect(getByTestId("frame").dataset.resizing).toBe("false");
  });

  it("an aborted drag (cancel, Escape, window blur) restores and commits nothing", () => {
    for (const abort of [
      (h: HTMLElement) => fireEvent.pointerCancel(h, { pointerId: 1 }),
      () => fireEvent.keyDown(window, { key: "Escape" }),
      () => fireEvent.blur(window),
    ]) {
      const onCommit = vi.fn();
      const { getByTestId, unmount } = render(<Harness onCommit={onCommit} />);
      const handle = getByTestId("handle");
      drag(handle, 300, 500);
      abort(handle);
      expect(onCommit).not.toHaveBeenCalled();
      expect(getByTestId("frame").style.width).toBe("min(300px, 100%)");
      expect(document.body.style.userSelect).toBe("");
      unmount();
    }
  });

  it("clamps to the minimum and the container", () => {
    const onCommit = vi.fn();
    const { getByTestId } = render(<Harness onCommit={onCommit} max={500} />);
    const handle = getByTestId("handle");
    drag(handle, 300, 5000);
    fireEvent.pointerUp(handle, { pointerId: 1 });
    drag(handle, 300, -5000);
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(onCommit.mock.calls).toEqual([[500], [48]]);
  });

  it("left handles grow leftward; centred media moves twice as fast", () => {
    const left = vi.fn();
    const a = render(<Harness onCommit={left} edge="left" />);
    drag(a.getByTestId("handle"), 300, 250);
    fireEvent.pointerUp(a.getByTestId("handle"), { pointerId: 1 });
    expect(left).toHaveBeenCalledWith(350);
    a.unmount();

    const centred = vi.fn();
    const b = render(<Harness onCommit={centred} centered />);
    drag(b.getByTestId("handle"), 300, 350);
    fireEvent.pointerUp(b.getByTestId("handle"), { pointerId: 1 });
    expect(centred).toHaveBeenCalledWith(400);
  });

  it("ignores other pointers and non-primary buttons, and a click with no movement commits nothing", () => {
    const onCommit = vi.fn();
    const { getByTestId } = render(<Harness onCommit={onCommit} />);
    const handle = getByTestId("handle");
    fireEvent.pointerDown(handle, { pointerId: 1, button: 2, clientX: 300 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 300 });
    fireEvent.pointerMove(handle, { pointerId: 2, clientX: 600 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 300 });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("unmounting mid-drag leaves nothing behind", () => {
    const onCommit = vi.fn();
    const { getByTestId, unmount } = render(<Harness onCommit={onCommit} />);
    drag(getByTestId("handle"), 300, 420);
    unmount();
    expect(document.body.style.userSelect).toBe("");
    expect(onCommit).not.toHaveBeenCalled();
  });
});
