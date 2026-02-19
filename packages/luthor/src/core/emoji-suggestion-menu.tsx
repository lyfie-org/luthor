import { useEffect, useMemo, useState } from "react";
import type { EmojiCatalogItem } from "@lyfie/luthor-headless";

export function EmojiSuggestionMenu({
  isOpen,
  query,
  position,
  suggestions,
  onClose,
  onExecute,
}: {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number } | null;
  suggestions: EmojiCatalogItem[];
  onClose: () => void;
  onExecute: (emoji: string) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return suggestions;
    }

    return suggestions.filter((item) => {
      const searchableText = `${item.label} ${item.shortcodes.join(" ")} ${(item.keywords || []).join(" ")}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [query, suggestions]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasItems = filteredSuggestions.length > 0;
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
          setSelectedIndex((prev) => Math.min(prev + 1, Math.max(filteredSuggestions.length - 1, 0)));
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
          if (!filteredSuggestions[selectedIndex]) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          onExecute(filteredSuggestions[selectedIndex].emoji);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [filteredSuggestions, isOpen, onClose, onExecute, selectedIndex]);

  if (!isOpen || !position) {
    return null;
  }

  return (
    <div
      className="luthor-emoji-menu"
      style={{ left: position.x, top: position.y }}
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
        {filteredSuggestions.length === 0 ? (
          <div className="luthor-emoji-menu-empty">No matching emoji</div>
        ) : (
          filteredSuggestions.map((item, index) => {
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
}
