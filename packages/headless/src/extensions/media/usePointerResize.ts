/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

/** Which edge a handle drags: the right edge grows rightward, the left leftward. */
export type ResizeEdge = "left" | "right";

export interface PointerResizeOptions {
  /** The element whose width is previewed while dragging. */
  frameRef: RefObject<HTMLElement | null>;
  /** Smallest width a drag may produce (CSS px). Default 48. */
  minWidth?: number;
  /** Largest width — usually the container's; read at drag start. */
  maxWidth?: () => number;
  /**
   * A centred element grows on both sides, so the pointer moves half as far as
   * the width changes; pass `true` to double the pointer delta.
   */
  centered?: boolean;
  /** Called once, on release, with the final width. Never during the drag. */
  onCommit: (width: number) => void;
  /** Optional: a live readout while dragging (e.g. a "480 px" badge). */
  onPreview?: (width: number | null) => void;
}

/**
 * Resize by dragging, done the robust way:
 *
 * - **Pointer Events + pointer capture**: mouse, touch and pen alike; the drag
 *   keeps tracking when the pointer leaves the handle, the element or the
 *   window, and a release anywhere ends it.
 * - **No editor writes while dragging**: the preview mutates only the frame's
 *   inline width (batched per animation frame). The document changes once, on
 *   release — one history step, one collaboration update, one save.
 * - **Every way a drag can end is handled**: release, `pointercancel`, lost
 *   capture, window blur and Escape. Anything but a release restores the
 *   original width and commits nothing.
 */
export function usePointerResize(options: PointerResizeOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [resizing, setResizing] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // A drag in progress when the element unmounts must not leak listeners.
  useEffect(() => () => cleanupRef.current?.(), []);

  const onPointerDown = useCallback((edge: ResizeEdge) => (event: ReactPointerEvent<HTMLElement>) => {
    const frame = optionsRef.current.frameRef.current;
    if (!frame || event.button !== 0 || cleanupRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startWidth = frame.getBoundingClientRect().width;
    const originalInline = frame.style.width;
    const min = Math.max(1, optionsRef.current.minWidth ?? 48);
    const max = Math.max(min, optionsRef.current.maxWidth?.() ?? Number.POSITIVE_INFINITY);
    const factor = (optionsRef.current.centered ? 2 : 1) * (edge === "left" ? -1 : 1);
    let width = startWidth;
    let frameRequest: number | null = null;
    let finished = false;

    try {
      handle.setPointerCapture(pointerId);
    } catch {
      // Synthetic events in tests have no live pointer to capture.
    }
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    setResizing(true);

    const paint = () => {
      frameRequest = null;
      frame.style.width = `${Math.round(width)}px`;
      optionsRef.current.onPreview?.(Math.round(width));
    };

    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== pointerId) return;
      width = Math.min(max, Math.max(min, startWidth + (move.clientX - startX) * factor));
      if (frameRequest === null) frameRequest = requestAnimationFrame(paint);
    };

    const finish = (commit: boolean) => {
      if (finished) return;
      finished = true;
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onCancel);
      handle.removeEventListener("lostpointercapture", onLost);
      window.removeEventListener("blur", onCancel);
      window.removeEventListener("keydown", onKey, true);
      try {
        if (handle.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
      } catch {
        // Already released.
      }
      document.body.style.userSelect = previousUserSelect;
      // Hand the width back to React: the committed value re-renders it, and an
      // aborted drag must look exactly as it did before.
      frame.style.width = originalInline;
      cleanupRef.current = null;
      setResizing(false);
      optionsRef.current.onPreview?.(null);
      const final = Math.round(width);
      if (commit && Math.abs(final - Math.round(startWidth)) >= 1) optionsRef.current.onCommit(final);
    };
    const onUp = (up: PointerEvent) => {
      if (up.pointerId === pointerId) finish(true);
    };
    const onCancel = () => finish(false);
    const onLost = () => finish(true);
    const onKey = (key: KeyboardEvent) => {
      if (key.key === "Escape") {
        key.preventDefault();
        key.stopPropagation();
        finish(false);
      }
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onCancel);
    handle.addEventListener("lostpointercapture", onLost);
    window.addEventListener("blur", onCancel);
    window.addEventListener("keydown", onKey, true);
    cleanupRef.current = () => finish(false);
  }, []);

  return { onPointerDown, resizing };
}
