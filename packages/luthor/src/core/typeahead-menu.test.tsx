/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MentionSuggestionMenu } from "./mention-suggestion-menu";
import { WikilinkSuggestionMenu } from "./wikilink-suggestion-menu";

const POSITION = { x: 120, y: 240 };

const USERS = [
  { username: "bea", name: "Bea Ito" },
  { username: "beatrix", name: "Beatrix Kim" },
];

const NOTES = [
  { id: "n1", title: "Roadmap" },
  { id: "n2", title: "Retro", color: "#ff8800" },
];

function renderMentionMenu(
  overrides: Partial<Parameters<typeof MentionSuggestionMenu>[0]> = {},
) {
  const onClose = vi.fn();
  const onExecute = vi.fn();
  const result = render(
    <MentionSuggestionMenu
      isOpen
      query="be"
      position={POSITION}
      suggestions={USERS}
      onClose={onClose}
      onExecute={onExecute}
      {...overrides}
    />,
  );
  return { ...result, onClose, onExecute };
}

function renderWikilinkMenu(
  overrides: Partial<Parameters<typeof WikilinkSuggestionMenu>[0]> = {},
) {
  const onClose = vi.fn();
  const onExecute = vi.fn();
  const result = render(
    <WikilinkSuggestionMenu
      isOpen
      query="ro"
      position={POSITION}
      suggestions={NOTES}
      onClose={onClose}
      onExecute={onExecute}
      {...overrides}
    />,
  );
  return { ...result, onClose, onExecute };
}

describe("MentionSuggestionMenu", () => {
  it("renders the handle and display name of every suggestion", () => {
    renderMentionMenu();

    expect(screen.getByText("@bea")).toBeInTheDocument();
    expect(screen.getByText("Bea Ito")).toBeInTheDocument();
    expect(screen.getByText("@beatrix")).toBeInTheDocument();
    expect(screen.getByText("@be")).toBeInTheDocument();
  });

  it("carries the class the trigger extension uses to recognise its own menu", () => {
    renderMentionMenu();

    expect(
      document.querySelector(".luthor-mention-typeahead"),
    ).toBeInTheDocument();
  });

  it("renders nothing while closed or unpositioned", () => {
    const { rerender } = renderMentionMenu({ isOpen: false });
    expect(screen.queryByRole("listbox", { hidden: true })).toBeNull();

    rerender(
      <MentionSuggestionMenu
        isOpen
        query="be"
        position={null}
        suggestions={USERS}
        onClose={vi.fn()}
        onExecute={vi.fn()}
      />,
    );
    expect(screen.queryByRole("listbox", { hidden: true })).toBeNull();
  });

  it("shows the empty state when the host returns nobody", () => {
    renderMentionMenu({ suggestions: [] });

    expect(screen.getByText("No matching users")).toBeInTheDocument();
  });

  it("selects the first suggestion with Enter", () => {
    const { onExecute } = renderMentionMenu();

    fireEvent.keyDown(document, { key: "Enter" });

    expect(onExecute).toHaveBeenCalledWith("bea");
  });

  it("moves the highlight with the arrow keys and commits with Tab", () => {
    const { onExecute } = renderMentionMenu();

    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Tab" });

    expect(onExecute).toHaveBeenCalledWith("beatrix");
  });

  it("stops at the ends of the list", () => {
    const { onExecute } = renderMentionMenu();

    fireEvent.keyDown(document, { key: "ArrowUp" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onExecute).toHaveBeenLastCalledWith("bea");

    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onExecute).toHaveBeenLastCalledWith("beatrix");
  });

  it("closes on Escape", () => {
    const { onClose } = renderMentionMenu();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("ignores Enter while the list is empty", () => {
    const { onExecute, onClose } = renderMentionMenu({ suggestions: [] });

    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "ArrowDown" });

    expect(onExecute).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("selects on click and follows the pointer on hover", () => {
    const { onExecute } = renderMentionMenu();

    const rows = screen.getAllByRole("option", { hidden: true });
    fireEvent.mouseEnter(rows[1]!);
    expect(rows[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.click(rows[1]!);
    expect(onExecute).toHaveBeenCalledWith("beatrix");
  });

  it("resets the highlight when the query changes", () => {
    const { rerender, onExecute } = renderMentionMenu();

    fireEvent.keyDown(document, { key: "ArrowDown" });
    rerender(
      <MentionSuggestionMenu
        isOpen
        query="bea"
        position={POSITION}
        suggestions={USERS}
        onClose={vi.fn()}
        onExecute={onExecute}
      />,
    );

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onExecute).toHaveBeenLastCalledWith("bea");
  });
});

describe("WikilinkSuggestionMenu", () => {
  it("renders the note titles and echoes the trigger query", () => {
    renderWikilinkMenu();

    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Retro")).toBeInTheDocument();
    expect(screen.getByText("[[ro")).toBeInTheDocument();
  });

  it("carries the class the wikilink trigger uses for its outside-click guard", () => {
    renderWikilinkMenu();

    expect(
      document.querySelector(".luthor-wikilink-typeahead"),
    ).toBeInTheDocument();
  });

  it("tints the row dot with the note colour when the host sends one", () => {
    renderWikilinkMenu();

    const dots = document.querySelectorAll(".luthor-typeahead-menu-item-dot");
    expect(dots).toHaveLength(2);
    expect(dots[1]).toHaveStyle({ background: "#ff8800" });
  });

  it("shows the empty state when no note matches", () => {
    renderWikilinkMenu({ suggestions: [] });

    expect(screen.getByText("No matching notes")).toBeInTheDocument();
  });

  it("commits the selected note title", () => {
    const { onExecute } = renderWikilinkMenu();

    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });

    expect(onExecute).toHaveBeenCalledWith("Retro");
  });

  it("closes on Escape", () => {
    const { onClose } = renderWikilinkMenu();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });
});
