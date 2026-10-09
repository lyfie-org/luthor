/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it } from "vitest";
import { computeAnchoredOverlayStyle } from "./overlay-position";

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

function setViewportSize(width: number, height: number): () => void {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
  return () => {
    Object.defineProperty(window, "innerWidth", { value: originalWidth, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: originalHeight, configurable: true });
  };
}

describe("computeAnchoredOverlayStyle", () => {
  it("clamps to viewport bounds when no portal container is provided", () => {
    const restoreViewport = setViewportSize(1024, 768);
    const style = computeAnchoredOverlayStyle({
      anchorRect: createRect({ left: 980, top: 740, width: 20, height: 20 }),
      overlay: { width: 300, height: 200 },
    });
    restoreViewport();

    expect(style.position).toBe("fixed");
    expect(style.left).toBe(700);
    expect(style.top).toBe(536);
    expect(style.maxWidth).toBe(1008);
    // Flipped above: it may grow only into the room above the anchor.
    expect(style.maxHeight).toBe(728);
  });

  it("accounts for portal scroll offsets when positioning absolute overlays", () => {
    const restoreViewport = setViewportSize(1280, 720);
    const container = document.createElement("div");
    container.scrollLeft = 50;
    container.scrollTop = 80;
    container.getBoundingClientRect = () =>
      createRect({ left: 100, top: 200, width: 400, height: 400 });

    const style = computeAnchoredOverlayStyle({
      anchorRect: createRect({ left: 470, top: 560, width: 20, height: 20 }),
      overlay: { width: 160, height: 140 },
      portalContainer: container,
    });
    restoreViewport();

    expect(style.position).toBe("absolute");
    expect(style.left).toBe(280);
    expect(style.top).toBe(296);
    expect(style.maxWidth).toBe(384);
    expect(style.maxHeight).toBe(348);
  });

  it("constrains oversized overlays to container limits", () => {
    const restoreViewport = setViewportSize(1280, 720);
    const container = document.createElement("div");
    container.getBoundingClientRect = () =>
      createRect({ left: 100, top: 100, width: 180, height: 120 });

    const style = computeAnchoredOverlayStyle({
      anchorRect: createRect({ left: 250, top: 180, width: 10, height: 10 }),
      overlay: { width: 400, height: 300 },
      portalContainer: container,
    });
    restoreViewport();

    expect(style.position).toBe("absolute");
    expect(style.left).toBe(8);
    expect(style.top).toBe(8);
    expect(style.maxWidth).toBe(164);
    expect(style.maxHeight).toBe(104);
  });

  it("stays inside a scrolling ancestor that clips a tall editor", () => {
    const restoreViewport = setViewportSize(1280, 900);
    // A note panel (scrolls) showing 100–500 of an editor 2000px tall.
    const panel = document.createElement("div");
    panel.style.overflowY = "auto";
    panel.getBoundingClientRect = () => createRect({ left: 0, top: 100, width: 800, height: 400 });
    Object.defineProperty(panel, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(panel, "clientWidth", { value: 800, configurable: true });
    const editor = document.createElement("div");
    editor.getBoundingClientRect = () => createRect({ left: 0, top: -300, width: 800, height: 2000 });
    panel.appendChild(editor);
    document.body.appendChild(panel);

    // A caret near the panel's bottom edge: a 300px menu can't go below.
    const style = computeAnchoredOverlayStyle({
      anchorRect: createRect({ left: 40, top: 470, width: 1, height: 18 }),
      overlay: { width: 300, height: 300 },
      portalContainer: editor,
    });
    panel.remove();
    restoreViewport();

    // Above the caret, within the panel (not the editor's off-screen box).
    const top = Number(style.top) + -300; // back to viewport coordinates
    expect(top).toBeGreaterThanOrEqual(108);
    expect(top + 300).toBeLessThanOrEqual(470);
  });

  it("shrinks onto the roomier side when it fits neither, instead of covering the anchor", () => {
    const restoreViewport = setViewportSize(1000, 600);
    const style = computeAnchoredOverlayStyle({
      anchorRect: createRect({ left: 40, top: 220, width: 1, height: 18 }),
      overlay: { width: 300, height: 420 },
    });
    restoreViewport();

    // Room below (600-8-242=350) beats room above (220-4-8=208).
    expect(style.top).toBe(242);
    expect(style.maxHeight).toBe(350);
  });
});
