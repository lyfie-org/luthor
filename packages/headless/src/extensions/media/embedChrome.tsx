/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  $createNodeSelection,
  $getNodeByKey,
  $getRoot,
  $setSelection,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
} from "lexical";
import { sanitizeUrlForAttribute } from "../../utils/urlSafety";
import { displayHost } from "./embedProviders";

/*
 * What every block of media shares, whatever it shows: a way out to the page it
 * came from (an "open" link on hover), and a way to move it by dragging it to
 * another place in the document.
 */

// ── Open the page ────────────────────────────────────────────────────────────

/**
 * A small "↗ site.com" link in the corner of an embed, shown on hover (and while
 * it is selected, for touch). A click on the embed itself selects it in an
 * editable document; this is the one-click way to the page instead.
 */
export function EmbedOpenLink({ url, label }: { url: string; label?: string }): ReactNode {
  const ref = useRef<HTMLAnchorElement>(null);
  const host = label ?? displayHost(url);
  // Native, not React: the editor's own root listeners see a click inside a
  // decorator first, and must not select the embed (or move the caret) for it.
  useEffect(() => {
    const link = ref.current;
    if (!link) return;
    const stop = (event: Event) => event.stopPropagation();
    link.addEventListener("mousedown", stop);
    link.addEventListener("pointerdown", stop);
    link.addEventListener("click", stop);
    return () => {
      link.removeEventListener("mousedown", stop);
      link.removeEventListener("pointerdown", stop);
      link.removeEventListener("click", stop);
    };
  }, []);
  const href = sanitizeUrlForAttribute(url);
  if (!href || href === "about:blank") return null;
  return (
    <a
      ref={ref}
      className="luthor-embed-open"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      contentEditable={false}
      draggable={false}
      title={url}
      aria-label={`Open ${host} in a new tab`}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M9 2.5h4.5V7M13.5 2.5L7.5 8.5M12 9.5v4H2.5V4h4" />
      </svg>
      <span className="luthor-embed-open__host">{host}</span>
    </a>
  );
}

// ── Drag to move ─────────────────────────────────────────────────────────────

/** Movement (px) before a press on media becomes a drag rather than a click. */
const DRAG_THRESHOLD_PX = 6;
/** Distance from the scroll area's edge at which a drag scrolls it. */
const AUTOSCROLL_EDGE_PX = 56;
const AUTOSCROLL_MAX_STEP_PX = 18;

/*
 * Presses that belong to something inside the media — its controls, its
 * toolbar, its resize handles, its open link — never start a move. A video or
 * audio element is excluded too (its timeline is scrubbed by dragging); those
 * move by their grip.
 */
const NO_DRAG = [
  "button",
  "input",
  "textarea",
  "select",
  "video",
  "audio",
  "iframe",
  "[contenteditable='true']",
  "[data-media-action]",
  ".luthor-media__toolbar",
  ".luthor-media__handle",
  ".luthor-media__error",
  ".luthor-media-embed-resize-handle-width",
  ".luthor-media-embed-resize-handle-height",
  ".luthor-embed-open",
  "[data-luthor-no-drag]",
].join(",");

/** Where a dragged block would land: before or after a top-level block. */
export interface BlockDropTarget {
  key: NodeKey;
  placement: "before" | "after";
}

interface BlockBox {
  key: NodeKey;
  top: number;
  bottom: number;
}

/**
 * The drop target for a pointer at `y` among top-level blocks (in document
 * order), or null when dropping there would leave `dragged` where it is.
 * Pure, for tests: the gap nearest the pointer, by block midpoints.
 */
export function resolveBlockDropTarget(blocks: readonly BlockBox[], y: number, dragged: NodeKey): BlockDropTarget | null {
  if (blocks.length === 0) return null;
  let target: BlockDropTarget = { key: blocks[blocks.length - 1]!.key, placement: "after" };
  for (const block of blocks) {
    if (y < (block.top + block.bottom) / 2) {
      target = { key: block.key, placement: "before" };
      break;
    }
  }
  const index = blocks.findIndex((block) => block.key === dragged);
  if (index === -1) return target;
  // Before itself, after itself, before the block after it, after the block before it: no move.
  if (target.key === dragged) return null;
  if (target.placement === "before" && blocks[index + 1]?.key === target.key) return null;
  if (target.placement === "after" && blocks[index - 1]?.key === target.key) return null;
  return target;
}

/** Move the block holding `nodeKey` to `target`, and keep it selected. */
export function moveBlockTo(editor: LexicalEditor, nodeKey: NodeKey, target: BlockDropTarget): void {
  editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if (!node) return;
    const block: LexicalNode = node.getTopLevelElement() ?? node;
    const anchor = $getNodeByKey(target.key);
    if (!anchor || anchor === block || anchor.isParentOf?.(block)) return;
    if (target.placement === "before") anchor.insertBefore(block);
    else anchor.insertAfter(block);
    const selection = $createNodeSelection();
    selection.add(nodeKey);
    $setSelection(selection);
  });
}

function scrollParent(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current && current !== document.body) {
    const { overflowY } = getComputedStyle(current);
    if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight) return current;
    current = current.parentElement;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

function blockBoxes(editor: LexicalEditor): BlockBox[] {
  const boxes: BlockBox[] = [];
  editor.getEditorState().read(() => {
    for (const child of $getRoot().getChildren()) {
      const element = editor.getElementByKey(child.getKey());
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      if (rect.height === 0 && rect.width === 0) continue;
      boxes.push({ key: child.getKey(), top: rect.top, bottom: rect.bottom });
    }
  });
  return boxes;
}

function draggedBlockKey(editor: LexicalEditor, nodeKey: NodeKey): NodeKey | null {
  let key: NodeKey | null = null;
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(nodeKey);
    key = node ? (node.getTopLevelElement() ?? node).getKey() : null;
  });
  return key;
}

export interface BlockDragOptions {
  editor: LexicalEditor | null;
  nodeKey: NodeKey | undefined;
  /** The element that dims while it is dragged (the media's own box). */
  elementRef: RefObject<HTMLElement | null>;
  /** Off for inline media, read-only documents, mid-resize. */
  enabled: boolean;
}

/**
 * Press on a piece of media and drag it up or down to move it: a line shows
 * where it will land, the area scrolls near its edges, `Escape` cancels. A
 * press that doesn't travel is still a click (it selects). One undo step.
 *
 * Returns the handlers for the media's box, and for its grip (which also
 * starts a drag from touch, and on video/audio, whose own surface scrubs).
 */
export function useBlockDrag({ editor, nodeKey, elementRef, enabled }: BlockDragOptions) {
  const [dragging, setDragging] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef({ editor, nodeKey, enabled });
  optionsRef.current = { editor, nodeKey, enabled };

  useEffect(() => () => cleanupRef.current?.(), []);

  const start = useCallback((event: ReactPointerEvent<HTMLElement>, fromGrip: boolean) => {
    const { editor: ed, nodeKey: key, enabled: on } = optionsRef.current;
    if (!ed || !key || !on || !ed.isEditable() || event.button !== 0 || cleanupRef.current) return;
    if (!fromGrip) {
      // Touch scrolls the page; on touch, media moves by its grip.
      if (event.pointerType === "touch") return;
      // Only what is inside the media counts: the editor around it is itself
      // contenteditable.
      const target = event.target instanceof Element ? event.target : null;
      const owner = target?.closest(NO_DRAG);
      if (owner && event.currentTarget.contains(owner)) return;
    } else {
      // Not preventDefault: that would swallow the mousedown that focuses the
      // editor, and a press on the grip that doesn't travel still selects the
      // media — with the keyboard then going to the editor, not the page.
      event.stopPropagation();
    }

    const editorRoot = ed.getRootElement();
    const draggedKey = draggedBlockKey(ed, key);
    if (!editorRoot || !draggedKey) return;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let lastY = startY;
    let active = false;
    let target: BlockDropTarget | null = null;
    let indicator: HTMLDivElement | null = null;
    let fixedOffset = { x: 0, y: 0 };
    let scrollFrame = 0;
    const scroller = scrollParent(editorRoot);
    const previousUserSelect = document.body.style.userSelect;
    const previousRootUserSelect = editorRoot.style.userSelect;

    const place = () => {
      target = resolveBlockDropTarget(blockBoxes(ed), lastY, draggedKey);
      if (!indicator) return;
      if (!target) {
        indicator.style.display = "none";
        return;
      }
      const element = ed.getElementByKey(target.key);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const rootRect = editorRoot.getBoundingClientRect();
      const neighbour = target.placement === "before" ? element.previousElementSibling : element.nextElementSibling;
      const other = neighbour?.getBoundingClientRect();
      const y =
        target.placement === "before"
          ? other ? (other.bottom + rect.top) / 2 : rect.top - 4
          : other ? (rect.bottom + other.top) / 2 : rect.bottom + 4;
      indicator.style.display = "block";
      indicator.style.top = `${Math.round(y - fixedOffset.y)}px`;
      indicator.style.left = `${Math.round(rootRect.left - fixedOffset.x)}px`;
      indicator.style.width = `${Math.round(rootRect.width)}px`;
    };

    const autoscroll = () => {
      scrollFrame = 0;
      if (!active || !scroller) return;
      const isDocument = scroller === document.scrollingElement || scroller === document.documentElement;
      const top = isDocument ? 0 : scroller.getBoundingClientRect().top;
      const bottom = isDocument ? window.innerHeight : scroller.getBoundingClientRect().bottom;
      let step = 0;
      if (lastY < top + AUTOSCROLL_EDGE_PX) step = -AUTOSCROLL_MAX_STEP_PX * Math.min(1, (top + AUTOSCROLL_EDGE_PX - lastY) / AUTOSCROLL_EDGE_PX);
      else if (lastY > bottom - AUTOSCROLL_EDGE_PX) step = AUTOSCROLL_MAX_STEP_PX * Math.min(1, (lastY - (bottom - AUTOSCROLL_EDGE_PX)) / AUTOSCROLL_EDGE_PX);
      if (step !== 0) {
        const before = scroller.scrollTop;
        scroller.scrollTop += step;
        if (scroller.scrollTop !== before) place();
      }
      scrollFrame = requestAnimationFrame(autoscroll);
    };

    const begin = () => {
      active = true;
      setDragging(true);
      window.getSelection()?.removeAllRanges();
      document.body.style.userSelect = "none";
      editorRoot.style.userSelect = "none";
      document.body.classList.add("luthor-is-block-dragging");
      indicator = document.createElement("div");
      indicator.className = "luthor-block-drop-indicator";
      indicator.setAttribute("aria-hidden", "true");
      indicator.style.position = "fixed";
      indicator.style.top = "0px";
      indicator.style.left = "0px";
      // Inside the editor's wrapper so it takes the editor's theme; `fixed`
      // can still be offset by a transformed ancestor, so measure that once.
      (editorRoot.parentElement ?? document.body).appendChild(indicator);
      const probe = indicator.getBoundingClientRect();
      fixedOffset = { x: probe.left, y: probe.top };
      place();
      scrollFrame = requestAnimationFrame(autoscroll);
    };

    // A drag ends with a click on whatever is under the pointer; it must not
    // select, follow a link, or open anything.
    const swallowClick = (click: MouseEvent) => {
      click.preventDefault();
      click.stopPropagation();
    };

    const finish = (commit: boolean) => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onCancel);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      cleanupRef.current = null;
      if (!active) return;
      indicator?.remove();
      document.body.style.userSelect = previousUserSelect;
      editorRoot.style.userSelect = previousRootUserSelect;
      document.body.classList.remove("luthor-is-block-dragging");
      setDragging(false);
      window.addEventListener("click", swallowClick, true);
      setTimeout(() => window.removeEventListener("click", swallowClick, true), 0);
      if (commit && target && key) moveBlockTo(ed, key, target);
    };
    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== pointerId) return;
      lastY = move.clientY;
      if (!active) {
        if (Math.hypot(move.clientX - startX, move.clientY - startY) < DRAG_THRESHOLD_PX) return;
        begin();
      }
      move.preventDefault();
      window.getSelection()?.removeAllRanges();
      place();
    };
    const onUp = (up: PointerEvent) => {
      if (up.pointerId === pointerId) finish(true);
    };
    const onCancel = () => finish(false);
    const onKey = (key: KeyboardEvent) => {
      if (key.key === "Escape" && active) {
        key.preventDefault();
        key.stopPropagation();
        finish(false);
      }
    };

    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", onCancel);
    cleanupRef.current = () => finish(false);
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => start(event, false), [start]);
  const onGripPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => start(event, true), [start]);
  // The browser's own drag of a picture or a link would take the pointer away.
  const onDragStart = useCallback((event: ReactDragEvent<HTMLElement>) => {
    if (optionsRef.current.enabled) event.preventDefault();
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    element.classList.toggle("is-block-dragging", dragging);
  }, [dragging, elementRef]);

  return { dragging, onPointerDown, onGripPointerDown, onDragStart };
}

/**
 * The grip on a piece of media: shown on hover and while selected, it starts a
 * move from any pointer — touch included — and on video and audio, whose own
 * surface is for scrubbing. Keyboard users move media with the toolbar's
 * Move up / Move down.
 */
export function BlockDragGrip({ onPointerDown }: { onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void }): ReactNode {
  return (
    <span
      className="luthor-block-drag-grip"
      contentEditable={false}
      aria-hidden="true"
      title="Drag to move"
      data-luthor-no-drag=""
      onPointerDown={onPointerDown}
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true" focusable="false">
        <circle cx="3" cy="3" r="1.25" />
        <circle cx="7" cy="3" r="1.25" />
        <circle cx="3" cy="7" r="1.25" />
        <circle cx="7" cy="7" r="1.25" />
        <circle cx="3" cy="11" r="1.25" />
        <circle cx="7" cy="11" r="1.25" />
      </svg>
    </span>
  );
}
