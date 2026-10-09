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

const CLIPPING_OVERFLOW = /(auto|scroll|hidden|clip)/;

function toBounds(left: number, top: number, right: number, bottom: number): OverlayBounds {
  return { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/**
 * The part of the window `element` can actually be seen in: the viewport cut
 * down by every scrolling or clipping ancestor (and the element itself, when it
 * clips). An editor inside a scrolling panel — a note in a dialog — is far
 * taller than what shows; an overlay placed against the editor's own box could
 * land below the panel's fold and be cut off. Returns null outside a browser.
 */
export function resolveVisibleBounds(element: Element | null): OverlayBounds | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  let left = 0;
  let top = 0;
  let right = window.innerWidth;
  let bottom = window.innerHeight;
  for (let node: Element | null = element; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    if (!CLIPPING_OVERFLOW.test(`${style.overflowX} ${style.overflowY}`)) continue;
    const rect = node.getBoundingClientRect();
    // The padding box, without a scrollbar (clientWidth/Height exclude it).
    const innerLeft = rect.left + node.clientLeft;
    const innerTop = rect.top + node.clientTop;
    const innerRight = node.clientWidth > 0 ? innerLeft + node.clientWidth : rect.right;
    const innerBottom = node.clientHeight > 0 ? innerTop + node.clientHeight : rect.bottom;
    left = Math.max(left, innerLeft);
    top = Math.max(top, innerTop);
    right = Math.min(right, innerRight);
    bottom = Math.min(bottom, innerBottom);
  }
  return toBounds(left, top, right, bottom);
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
  const own = toBounds(rect.left, rect.top, rect.right, rect.bottom);
  // Only the visible part of the container: a long note scrolls inside its
  // panel, and an overlay must stay where it can be seen.
  const visible = resolveVisibleBounds(portalContainer);
  if (!visible) return own;
  const clipped = toBounds(
    Math.max(own.left, visible.left),
    Math.max(own.top, visible.top),
    Math.min(own.right, visible.right),
    Math.min(own.bottom, visible.bottom),
  );
  // Scrolled entirely out of view: nothing sensible to clip to.
  return clipped.width > 0 && clipped.height > 0 ? clipped : own;
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

/**
 * Smallest room worth shrinking an overlay into (it scrolls) rather than
 * letting it cover its anchor.
 */
const MIN_SHRUNK_HEIGHT = 160;

function resolveVerticalPosition(
  anchorRect: DOMRect,
  overlayHeight: number,
  bounds: OverlayBounds,
  gap: number,
  margin: number,
  preferredY: OverlayVerticalAlign,
  flipY: boolean,
): { top: number; maxHeight?: number } {
  const primaryTop =
    preferredY === "top"
      ? anchorRect.top - overlayHeight - gap
      : anchorRect.bottom + gap;
  const alternateTop =
    preferredY === "top"
      ? anchorRect.bottom + gap
      : anchorRect.top - overlayHeight - gap;

  const minTop = bounds.top + margin;
  const maxTop = Math.max(minTop, bounds.bottom - overlayHeight - margin);
  const fits = (value: number) => value >= minTop && value <= maxTop;
  const roomBelow = bounds.bottom - margin - (anchorRect.bottom + gap);
  const roomAbove = anchorRect.top - gap - (bounds.top + margin);
  const roomFor = (side: OverlayVerticalAlign) => (side === "top" ? roomAbove : roomBelow);
  const alternateSide: OverlayVerticalAlign = preferredY === "top" ? "bottom" : "top";

  // Placed on a side, it may grow only as far as that side has room — so a
  // menu measured while shrunk settles there instead of growing back over
  // the fold on the next pass.
  if (fits(primaryTop)) {
    return { top: primaryTop, maxHeight: roomFor(preferredY) };
  }
  if (flipY) {
    if (fits(alternateTop)) {
      return { top: alternateTop, maxHeight: roomFor(alternateSide) };
    }
    // Fits neither side whole: take the roomier side and shrink to it (a
    // menu scrolls), so it never covers the caret — unless that room is too
    // small to be useful, then overlap as before.
    const room = Math.max(roomBelow, roomAbove);
    if (room > 0 && room >= Math.min(overlayHeight, MIN_SHRUNK_HEIGHT)) {
      return roomBelow >= roomAbove
        ? { top: anchorRect.bottom + gap, maxHeight: roomBelow }
        : { top: anchorRect.top - gap - Math.min(overlayHeight, roomAbove), maxHeight: roomAbove };
    }
  }

  return { top: clamp(primaryTop, minTop, maxTop) };
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
  const vertical = resolveVerticalPosition(
    anchorRect,
    overlayHeight,
    bounds,
    gap,
    margin,
    preferredY,
    flipY,
  );
  const viewportTop = vertical.top;
  const maxHeight = vertical.maxHeight ?? (maxOverlayHeight > 0 ? maxOverlayHeight : undefined);

  if (portalContainer) {
    const containerRect = portalContainer.getBoundingClientRect();
    return {
      position: "absolute",
      left: viewportLeft - containerRect.left + portalContainer.scrollLeft,
      top: viewportTop - containerRect.top + portalContainer.scrollTop,
      maxWidth: maxOverlayWidth > 0 ? maxOverlayWidth : undefined,
      maxHeight,
    };
  }

  return {
    position: "fixed",
    left: viewportLeft,
    top: viewportTop,
    maxWidth: maxOverlayWidth > 0 ? maxOverlayWidth : undefined,
    maxHeight,
  };
}

/**
 * A menu's placement with its height capped twice: by the room the placement
 * found (so it never runs past the visible area) and by the menu's own
 * stylesheet cap (an inline `max-height` replaces the stylesheet's, and the
 * room alone let a long list grow to the whole editor's height).
 */
export function withOverlayHeightCap(style: CSSProperties, cap: string): CSSProperties {
  const room = typeof style.maxHeight === "number" ? Math.max(0, Math.floor(style.maxHeight)) : null;
  return { ...style, maxHeight: room === null ? cap : `min(${room}px, ${cap})` };
}

/** Keep the highlighted option of a listbox in view as the arrow keys move it. */
export function scrollActiveOptionIntoView(menu: HTMLElement | null): void {
  const active = menu?.querySelector<HTMLElement>('[aria-selected="true"]');
  if (active && typeof active.scrollIntoView === "function") {
    active.scrollIntoView({ block: "nearest" });
  }
}

/**
 * How long to wait for `requestAnimationFrame` before revealing an overlay
 * anyway. Long enough that a normal frame wins the race, short enough that a
 * user never perceives the delay if it does not.
 */
export const OVERLAY_REVEAL_FALLBACK_MS = 50;

/**
 * Reveal a caret-anchored overlay once it has been measured.
 *
 * The menus render hidden for one pass so they can measure themselves, then
 * flip to visible. Doing that flip in `requestAnimationFrame` alone is a trap:
 * environments that never run rAF — some embedded webviews, and the headless
 * panes used for automated checks — leave the menu mounted, populated, and
 * permanently invisible, which is indistinguishable from a broken dropdown. A
 * timeout backstop guarantees the reveal happens; whichever fires first wins,
 * and the other is cancelled.
 *
 * Returns the cleanup for both schedules.
 */
export function scheduleOverlayReveal(reveal: () => void): () => void {
  let revealed = false;
  const run = () => {
    if (revealed) return;
    revealed = true;
    reveal();
  };

  const canAnimate =
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function";
  const frame = canAnimate ? window.requestAnimationFrame(run) : null;
  const timer = setTimeout(run, OVERLAY_REVEAL_FALLBACK_MS);

  return () => {
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
    }
    clearTimeout(timer);
  };
}

/**
 * The rect a caret menu hangs from: from the caret line's top (when the menu
 * was told it) down to the point under the caret it opens at. Placed below,
 * it opens at that point as before; flipped above, it clears the line instead
 * of covering what is being typed.
 */
export function createCaretAnchorRect(position: { x: number; y: number; top?: number }): DOMRect {
  const top = typeof position.top === "number" && position.top < position.y ? position.top : position.y;
  const point = createPointRect(position.x, position.y);
  return { ...point, y: top, top, height: point.bottom - top, toJSON: () => ({}) } as DOMRect;
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
