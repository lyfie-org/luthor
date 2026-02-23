import { useEffect, useRef, useState } from "react";
import type { CommandPaletteItem } from "@lyfie/luthor-headless";
import { SearchIcon, CommandIcon } from "./icons";

export function CommandPalette({
  isOpen,
  onClose,
  commands,
}: {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandPaletteItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter((cmd) => {
    const searchText = `${cmd.label} ${cmd.description || ""} ${cmd.keywords?.join(" ") || ""}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  const groupedCommands = filteredCommands.reduce(
    (groups, cmd) => {
      const category = cmd.category || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(cmd);
      return groups;
    },
    {} as Record<string, CommandPaletteItem[]>,
  );

  const flatCommands = filteredCommands;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const listElement = listRef.current;
    if (!listElement) {
      return;
    }

    const selectedElement = listElement.querySelector<HTMLElement>(".luthor-command-palette-item.selected");
    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [isOpen, selectedIndex, query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          onClose();
          break;
        case "ArrowDown":
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          event.preventDefault();
          event.stopPropagation();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
            onClose();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, selectedIndex, flatCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="luthor-command-palette-overlay" onClick={onClose}>
      <div
        className="luthor-command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="luthor-command-palette-header">
          <SearchIcon size={16} className="luthor-command-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="luthor-command-palette-input"
          />
          <kbd className="luthor-command-palette-kbd">ESC</kbd>
        </div>

        <div ref={listRef} className="luthor-command-palette-list">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="luthor-command-palette-empty">No commands found</div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="luthor-command-palette-group">
                <div className="luthor-command-palette-group-title">{category}</div>
                {items.map((cmd) => {
                  const globalIndex = flatCommands.indexOf(cmd);
                  return (
                    <div
                      key={cmd.id}
                      className={`luthor-command-palette-item ${globalIndex === selectedIndex ? "selected" : ""}`}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="luthor-command-palette-item-content">
                        <div className="luthor-command-palette-item-title">{cmd.label}</div>
                        {cmd.description && <div className="luthor-command-palette-item-description">{cmd.description}</div>}
                      </div>
                      {cmd.shortcut && <kbd className="luthor-command-palette-item-shortcut">{cmd.shortcut}</kbd>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="luthor-command-palette-footer">
          <span className="luthor-command-palette-hint">
            <CommandIcon size={14} />
            <span>Use arrow keys, Enter, ESC</span>
          </span>
        </div>
      </div>
    </div>
  );
}
