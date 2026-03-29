/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { CSSProperties } from "react";

type OverlayAxisAlign = "start" | "center" | "end";
type OverlayVerticalAlign = "top" | "bottom";

type OverlayBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type OverlayDimensions = {
  width: number;
  height: number;
};

export function resolveEditorPortalContainer(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  return (element.closest(".luthor-editor-wrapper") as HTMLElement | null) ?? null;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function resolveOverlayBounds(portalContainer: HTMLElement | null): OverlayBounds {
  if (!portalContainer || typeof window === "undefined") {
    const width = typeof window === "undefined" ? 0 : window.innerWidth;
    const height = typeof window === "undefined" ? 0 : window.innerHeight;
    return {
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
    };
  }

  const rect = portalContainer.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function resolveHorizontalPosition(
  anchorRect: DOMRect,
  overlayWidth: number,
  bounds: OverlayBounds,
  margin: number,
  preferredX: OverlayAxisAlign,
  flipX: boolean,
): number {
  const primaryLeft =
    preferredX === "end"
      ? anchorRect.right - overlayWidth
      : preferredX === "center"
        ? anchorRect.left + anchorRect.width / 2 - overlayWidth / 2
        : anchorRect.left;

  const alternateLeft =
    preferredX === "end"
      ? anchorRect.left
      : preferredX === "center"
        ? anchorRect.left + anchorRect.width / 2 - overlayWidth / 2
        : anchorRect.right - overlayWidth;

  let left = primaryLeft;
  const minLeft = bounds.left + margin;
  const maxLeft = Math.max(minLeft, bounds.right - overlayWidth - margin);

  if (flipX) {
    const primaryOverflows = left < minLeft || left > maxLeft;
    const alternateFits = alternateLeft >= minLeft && alternateLeft <= maxLeft;
    if (primaryOverflows && alternateFits) {
      left = alternateLeft;
    }
  }

  return clamp(left, minLeft, maxLeft);
}

function resolveVerticalPosition(
  anchorRect: DOMRect,
  overlayHeight: number,
  bounds: OverlayBounds,
  gap: number,
  margin: number,
  preferredY: OverlayVerticalAlign,
  flipY: boolean,
): number {
  const primaryTop =
    preferredY === "top"
      ? anchorRect.top - overlayHeight - gap
      : anchorRect.bottom + gap;
  const alternateTop =
    preferredY === "top"
      ? anchorRect.bottom + gap
      : anchorRect.top - overlayHeight - gap;

  let top = primaryTop;
  const minTop = bounds.top + margin;
  const maxTop = Math.max(minTop, bounds.bottom - overlayHeight - margin);

  if (flipY) {
    const primaryOverflows = top < minTop || top > maxTop;
    const alternateFits = alternateTop >= minTop && alternateTop <= maxTop;
    if (primaryOverflows && alternateFits) {
      top = alternateTop;
    }
  }

  return clamp(top, minTop, maxTop);
}

export function computeAnchoredOverlayStyle({
  anchorRect,
  overlay,
  portalContainer = null,
  gap = 4,
  margin = 8,
  preferredX = "start",
  preferredY = "bottom",
  flipX = true,
  flipY = true,
}: {
  anchorRect: DOMRect;
  overlay: OverlayDimensions;
  portalContainer?: HTMLElement | null;
  gap?: number;
  margin?: number;
  preferredX?: OverlayAxisAlign;
  preferredY?: OverlayVerticalAlign;
  flipX?: boolean;
  flipY?: boolean;
}): CSSProperties {
  const bounds = resolveOverlayBounds(portalContainer);
  const maxOverlayWidth = Math.max(0, bounds.width - margin * 2);
  const maxOverlayHeight = Math.max(0, bounds.height - margin * 2);
  const overlayWidth = Math.max(0, Math.min(overlay.width, maxOverlayWidth));
  const overlayHeight = Math.max(0, Math.min(overlay.height, maxOverlayHeight));
  const viewportLeft = resolveHorizontalPosition(
    anchorRect,
    overlayWidth,
    bounds,
    margin,
    preferredX,
    flipX,
  );
  const viewportTop = resolveVerticalPosition(
    anchorRect,
    overlayHeight,
    bounds,
    gap,
    margin,
    preferredY,
    flipY,
  );

  if (portalContainer) {
    const containerRect = portalContainer.getBoundingClientRect();
    return {
      position: "absolute",
      left: viewportLeft - containerRect.left + portalContainer.scrollLeft,
      top: viewportTop - containerRect.top + portalContainer.scrollTop,
      maxWidth: maxOverlayWidth > 0 ? maxOverlayWidth : undefined,
      maxHeight: maxOverlayHeight > 0 ? maxOverlayHeight : undefined,
    };
  }

  return {
    position: "fixed",
    left: viewportLeft,
    top: viewportTop,
    maxWidth: maxOverlayWidth > 0 ? maxOverlayWidth : undefined,
    maxHeight: maxOverlayHeight > 0 ? maxOverlayHeight : undefined,
  };
}

export function createPointRect(x: number, y: number): DOMRect {
  return {
    x,
    y,
    width: 1,
    height: 1,
    left: x,
    right: x + 1,
    top: y,
    bottom: y + 1,
    toJSON: () => ({}),
  } as DOMRect;
}
