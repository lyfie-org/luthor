import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { EmojiCatalogItem } from "@lyfie/luthor-headless";
import { getOverlayThemeStyleFromSelection } from "./overlay-theme";

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

  if (!isOpen || !position) {
    return null;
  }

  const resolvedStyle = (() => {
    const base = getOverlayThemeStyleFromSelection();
    if (!position) return base;
    if (!portalContainer) {
      return { ...base, left: position.x, top: position.y };
    }

    const containerRect = portalContainer.getBoundingClientRect();
    const rawLeft = position.x - containerRect.left;
    const maxLeft = Math.max(12, containerRect.width - 320);
    return {
      ...base,
      left: Math.max(12, Math.min(rawLeft, maxLeft)),
      top: Math.max(12, position.y - containerRect.top),
      position: "absolute" as const,
    };
  })();

  const menu = (
    <div
      className="luthor-emoji-menu"
      style={resolvedStyle}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="luthor-emoji-menu-header">
        <span className="luthor-emoji-menu-title">Emoji</span>
        <span className="luthor-emoji-menu-query">:{query}</span>
      </div>

      <div className="luthor-emoji-menu-list">
        {suggestions.length === 0 ? (
          <div className="luthor-emoji-menu-empty">No matching emoji</div>
        ) : (
          suggestions.map((item, index) => {
            const selected = index === selectedIndex;
            const primaryShortcode = item.shortcodes[0] ? `:${item.shortcodes[0]}:` : "";
            return (
              <button
                key={`${item.emoji}-${item.label}`}
                type="button"
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
