/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { EmojiCatalogItem } from "@lyfie/luthor-headless";
import { getOverlayThemeStyleFromSelection } from "./overlay-theme";
import {
  computeAnchoredOverlayStyle,
  createPointRect,
  scheduleOverlayReveal,
} from "./overlay-position";

export function EmojiSuggestionMenu({
  isOpen,
  query,
  position,
  portalContainer,
  suggestions,
  onClose,
  onExecute,
}: {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number } | null;
  portalContainer?: HTMLElement | null;
  suggestions: EmojiCatalogItem[];
  onClose: () => void;
  onExecute: (emoji: string) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasItems = suggestions.length > 0;
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
          setSelectedIndex((prev) => Math.min(prev + 1, Math.max(suggestions.length - 1, 0)));
          break;
        case "ArrowUp":
          if (!hasItems) return;
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
        case "Tab":
          if (!hasItems) return;
          if (!suggestions[selectedIndex]) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          onExecute(suggestions[selectedIndex].emoji);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose, onExecute, selectedIndex, suggestions]);

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

  // Measure hidden, then reveal — with a timeout backstop, so an environment
  // that never runs rAF cannot leave the menu permanently invisible.
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
      className="luthor-emoji-menu"
      ref={menuRef}
      style={menuStyle}
      role="listbox"
      aria-label="Emoji suggestions"
      aria-activedescendant={
        suggestions[selectedIndex]
          ? `luthor-emoji-option-${selectedIndex}`
          : undefined
      }
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="luthor-emoji-menu-header" aria-hidden="true">
        <span className="luthor-emoji-menu-title">Emoji</span>
        <span className="luthor-emoji-menu-query">:{query}</span>
      </div>

      <div className="luthor-emoji-menu-list">
        {suggestions.length === 0 ? (
          <div className="luthor-emoji-menu-empty" role="status">
            No matching emoji
          </div>
        ) : (
          suggestions.map((item, index) => {
            const selected = index === selectedIndex;
            const primaryShortcode = item.shortcodes[0] ? `:${item.shortcodes[0]}:` : "";
            return (
              <button
                key={`${item.emoji}-${item.label}`}
                id={`luthor-emoji-option-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={item.label}
                // Driven by arrow keys with focus left in the editor, so
                // options stay out of the Tab order.
                tabIndex={-1}
                className={`luthor-emoji-menu-item ${selected ? "selected" : ""}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onExecute(item.emoji);
                }}
              >
                <span className="luthor-emoji-menu-item-symbol" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="luthor-emoji-menu-item-content">
                  <span className="luthor-emoji-menu-item-title">{item.label}</span>
                  {primaryShortcode && (
                    <span className="luthor-emoji-menu-item-shortcode">{primaryShortcode}</span>
                  )}
                </span>
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
