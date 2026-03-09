import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { SlashCommandItem } from "@lyfie/luthor-headless";
import { getOverlayThemeStyleFromSelection } from "./overlay-theme";
import { computeAnchoredOverlayStyle, createPointRect } from "./overlay-position";

export function SlashCommandMenu({
  isOpen,
  query,
  position,
  portalContainer,
  commands,
  onClose,
  onExecute,
}: {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number } | null;
  portalContainer?: HTMLElement | null;
  commands: SlashCommandItem[];
  onClose: () => void;
  onExecute: (commandId: string) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return commands;
    }

    return commands.filter((command) => {
      const searchableText = `${command.label} ${command.description || ""} ${command.keywords?.join(" ") || ""}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [commands, query]);

  const groupedCommands = useMemo(
    () =>
      filteredCommands.reduce(
        (groups, command) => {
          const groupName = command.category || "Other";
          if (!groups[groupName]) {
            groups[groupName] = [];
          }
          groups[groupName].push(command);
          return groups;
        },
        {} as Record<string, SlashCommandItem[]>,
      ),
    [filteredCommands],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasItems = filteredCommands.length > 0;
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
          setSelectedIndex((prev) => Math.min(prev + 1, Math.max(filteredCommands.length - 1, 0)));
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
          if (!filteredCommands[selectedIndex]) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          onExecute(filteredCommands[selectedIndex].id);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [filteredCommands, isOpen, onClose, onExecute, selectedIndex]);

  const updateMenuPosition = useCallback((isVisible: boolean) => {
    if (!position) return;
    const measuredRect = menuRef.current?.getBoundingClientRect();
    const placement = computeAnchoredOverlayStyle({
      anchorRect: createPointRect(position.x, position.y),
      overlay: {
        width: measuredRect?.width ?? 420,
        height: measuredRect?.height ?? 360,
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

  useLayoutEffect(() => {
    if (!isOpen || !position) return;
    updateMenuPosition(false);
    const frame = window.requestAnimationFrame(() => updateMenuPosition(true));
    return () => window.cancelAnimationFrame(frame);
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
      className="luthor-slash-menu"
      ref={menuRef}
      style={menuStyle}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="luthor-slash-menu-header">
        <span className="luthor-slash-menu-title">Insert block</span>
        <span className="luthor-slash-menu-query">/{query}</span>
      </div>

      <div className="luthor-slash-menu-list">
        {filteredCommands.length === 0 ? (
          <div className="luthor-slash-menu-empty">No matching commands</div>
        ) : (
          Object.entries(groupedCommands).map(([groupName, items]) => (
            <div key={groupName} className="luthor-slash-menu-group">
              <div className="luthor-slash-menu-group-title">{groupName}</div>
              {items.map((command) => {
                const globalIndex = filteredCommands.indexOf(command);
                const selected = globalIndex === selectedIndex;
                return (
                  <button
                    key={command.id}
                    type="button"
                    className={`luthor-slash-menu-item ${selected ? "selected" : ""}`}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onExecute(command.id);
                    }}
                  >
                    <span className="luthor-slash-menu-item-content">
                      <span className="luthor-slash-menu-item-title">{command.label}</span>
                      {command.description && (
                        <span className="luthor-slash-menu-item-description">{command.description}</span>
                      )}
                    </span>
                    {command.shortcut && <kbd className="luthor-slash-menu-item-shortcut">{command.shortcut}</kbd>}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return menu;
  }

  return createPortal(menu, portalContainer ?? document.body);
}
