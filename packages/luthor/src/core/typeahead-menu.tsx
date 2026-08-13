/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The shared dropdown shell behind the trigger-driven suggestion menus
 * (`@` mentions, `[[` note links). It owns everything those menus have in
 * common — portal rendering, caret-anchored placement with viewport flipping,
 * the overlay theme, keyboard navigation, and the empty state — so each menu
 * only describes its own rows.
 *
 * The emoji and slash menus predate this shell and keep their own markup; this
 * is not a refactor of them, only the shared base for the trigger menus added
 * afterwards.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { getOverlayThemeStyleFromSelection } from "./overlay-theme";
import {
  computeAnchoredOverlayStyle,
  createPointRect,
  scheduleOverlayReveal,
} from "./overlay-position";

/** Props shared by every trigger-driven suggestion menu. */
export interface TypeaheadMenuProps<TItem> {
  /** Whether the trigger extension currently has an open match. */
  isOpen: boolean;
  /** The caret position the menu anchors to, in viewport coordinates. */
  position: { x: number; y: number } | null;
  /** Portal target; defaults to `document.body`. */
  portalContainer?: HTMLElement | null;
  /** The suggestions to render, already filtered by the host's search. */
  items: readonly TItem[];
  /**
   * Extra class on the menu root. Trigger extensions use it to recognise their
   * own menu in the outside-click guard, so it must match the selector the
   * extension checks (e.g. `luthor-mention-typeahead`).
   */
  menuClassName: string;
  /** Menu heading, e.g. "Mention". */
  title: string;
  /** The raw trigger text echoed in the header, e.g. `@bea`. */
  queryLabel: string;
  /** Shown instead of the list when there are no suggestions. */
  emptyLabel: string;
  /** Stable React key for a row. */
  getItemKey: (item: TItem, index: number) => string;
  /** Row content. The shell owns the row button, selection, and hover. */
  renderItem: (item: TItem) => ReactNode;
  /** Close the menu without selecting (Escape, or the host's own close). */
  onClose: () => void;
  /** Commit the highlighted suggestion. */
  onSelect: (item: TItem) => void;
}

/**
 * Caret-anchored suggestion dropdown. Rendered in a portal so it escapes the
 * editor's overflow, positioned against the caret point, and driven entirely by
 * the keyboard (Escape closes; Arrow keys move; Enter/Tab select) with mouse
 * hover and click as the pointer equivalents.
 */
export function TypeaheadMenu<TItem>({
  isOpen,
  position,
  portalContainer,
  items,
  menuClassName,
  title,
  queryLabel,
  emptyLabel,
  getItemKey,
  renderItem,
  onClose,
  onSelect,
}: TypeaheadMenuProps<TItem>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    setSelectedIndex(0);
  }, [queryLabel, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasItems = items.length > 0;
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          onClose();
          break;
        case "ArrowDown":
          if (!hasItems) return;
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) => Math.min(prev + 1, Math.max(items.length - 1, 0)));
          break;
        case "ArrowUp":
          if (!hasItems) return;
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
        case "Tab": {
          if (!hasItems) return;
          const item = items[selectedIndex];
          if (!item) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          onSelect(item);
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, items, onClose, onSelect, selectedIndex]);

  const updateMenuPosition = useCallback((isVisible: boolean) => {
    if (!position) return;
    const measuredRect = menuRef.current?.getBoundingClientRect();
    const placement = computeAnchoredOverlayStyle({
      anchorRect: createPointRect(position.x, position.y),
      overlay: {
        width: measuredRect?.width ?? 320,
        height: measuredRect?.height ?? 280,
      },
      portalContainer: portalContainer ?? null,
      gap: 6,
      margin: 12,
      preferredX: "start",
      preferredY: "bottom",
      flipX: true,
      flipY: true,
    });

    setMenuStyle({
      ...placement,
      visibility: isVisible ? "visible" : "hidden",
      ...getOverlayThemeStyleFromSelection(),
    });
  }, [portalContainer, position]);

  // Measure hidden, then reveal. The reveal is scheduled with a timeout
  // backstop so the menu can never stay stuck invisible where rAF never runs.
  useLayoutEffect(() => {
    if (!isOpen || !position) return;
    updateMenuPosition(false);
    return scheduleOverlayReveal(() => updateMenuPosition(true));
  }, [isOpen, position, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen || !position) return;
    const handleViewportChange = () => updateMenuPosition(true);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, position, updateMenuPosition]);

  if (!isOpen || !position) {
    return null;
  }

  const menu = (
    <div
      className={`luthor-typeahead-menu ${menuClassName}`}
      ref={menuRef}
      style={menuStyle}
      role="listbox"
      aria-label={title}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="luthor-typeahead-menu-header">
        <span className="luthor-typeahead-menu-title">{title}</span>
        <span className="luthor-typeahead-menu-query">{queryLabel}</span>
      </div>

      <div className="luthor-typeahead-menu-list">
        {items.length === 0 ? (
          <div className="luthor-typeahead-menu-empty">{emptyLabel}</div>
        ) : (
          items.map((item, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                key={getItemKey(item, index)}
                type="button"
                role="option"
                aria-selected={selected}
                className={`luthor-typeahead-menu-item ${selected ? "selected" : ""}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelect(item);
                }}
              >
                {renderItem(item)}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return menu;
  }

  return createPortal(menu, portalContainer ?? document.body);
}
