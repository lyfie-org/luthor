import React, { useState, useEffect, useRef } from "react";
import type { CommandPaletteItem } from "@lyfie/luthor";
import { MagnifyingGlassIcon, CommandIcon } from "@phosphor-icons/react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandPaletteItem[];
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = commands.filter((cmd) => {
    const searchText =
      `${cmd.label} ${cmd.description || ""} ${cmd.keywords?.join(" ") || ""}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (groups, cmd) => {
      const category = cmd.category || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(cmd);
      return groups;
    },
    {} as Record<string, CommandPaletteItem[]>,
  );

  // Flatten for navigation
  const flatCommands = filteredCommands;

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, flatCommands.length - 1),
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
            onClose();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="luthor-command-palette-overlay" onClick={onClose}>
      <div
        className="luthor-command-palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="luthor-command-palette-header">
          <MagnifyingGlassIcon size={16} className="luthor-command-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="luthor-command-palette-input"
          />
          <kbd className="luthor-command-palette-kbd">ESC</kbd>
        </div>

        <div ref={listRef} className="luthor-command-palette-list">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="luthor-command-palette-empty">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="luthor-command-palette-group">
                <div className="luthor-command-palette-group-title">
                  {category}
                </div>
                {commands.map((cmd, cmdIndex) => {
                  const globalIndex = flatCommands.indexOf(cmd);
                  return (
                    <div
                      key={cmd.id}
                      className={`luthor-command-palette-item ${
                        globalIndex === selectedIndex ? "selected" : ""
                      }`}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="luthor-command-palette-item-content">
                        <div className="luthor-command-palette-item-title">
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div className="luthor-command-palette-item-description">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="luthor-command-palette-item-shortcut">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="luthor-command-palette-footer">
          <span className="luthor-command-palette-hint">
            <kbd>↑↓</kbd> to navigate, <kbd>↵</kbd> to select, <kbd>ESC</kbd> to
            close
          </span>
        </div>
      </div>
    </div>
  );
}
