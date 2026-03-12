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
    expect(style.maxHeight).toBe(752);
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
    expect(style.maxHeight).toBe(384);
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
});
