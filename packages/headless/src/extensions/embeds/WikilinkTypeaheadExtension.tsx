/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * `[[` typeahead trigger for wikilink insertion.
 *
 * Detects when the user types `[[` inside a paragraph or heading and exposes a
 * subscribable state (query, position, open/closed) so the preset can render a
 * note-search dropdown. When a result is selected, the extension replaces the
 * trigger text with a {@link WikilinkNode}.
 *
 * The extension is deliberately search-agnostic: it does not call
 * `searchNotes()` — the UI layer (preset or host) subscribes, runs the search,
 * renders results, and calls `selectWikilink` with the chosen target. This keeps
 * the headless package free of host-specific data fetching.
 */

import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type LexicalEditor,
} from "lexical";
import {
  type BaseExtensionConfig,
  ExtensionCategory,
} from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { $createWikilinkNode } from "./WikilinkNode";

/** The subscribable state of the wikilink typeahead menu. */
export type WikilinkTypeaheadMenuState = {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number } | null;
};

export interface WikilinkTypeaheadConfig extends BaseExtensionConfig {
  offset?: { x: number; y: number };
}

export type WikilinkTypeaheadCommands = {
  selectWikilink: (target: string, alias?: string) => void;
  closeWikilinkMenu: () => void;
};

export type WikilinkTypeaheadStateQueries = {
  isWikilinkMenuOpen: () => Promise<boolean>;
};

type TypeaheadMatch = {
  nodeKey: string;
  startOffset: number;
  endOffset: number;
  query: string;
};

const TRIGGER = "[[";
const ALLOWED_CONTAINER_TYPES = new Set(["paragraph", "heading"]);

/**
 * Headless extension providing the `[[` typeahead trigger for wikilink
 * insertion. Subscribe to the menu state, render your own dropdown, and call
 * `selectWikilink` when the user picks a note.
 */
export class WikilinkTypeaheadExtension extends BaseExtension<
  "wikilinkTypeahead",
  WikilinkTypeaheadConfig,
  WikilinkTypeaheadCommands,
  WikilinkTypeaheadStateQueries
> {
  private listeners: ((state: WikilinkTypeaheadMenuState) => void)[] = [];
  private isOpen = false;
  private query = "";
  private position: { x: number; y: number } | null = null;
  private activeMatch: TypeaheadMatch | null = null;
  private editor: LexicalEditor | null = null;
  private viewportRafId: number | null = null;

  constructor(config: WikilinkTypeaheadConfig = {}) {
    super("wikilinkTypeahead", [ExtensionCategory.Floating]);
    this.config = { offset: { x: 0, y: 8 }, ...config };
  }

  register(editor: LexicalEditor): () => void {
    this.editor = editor;

    const unregisterUpdate = editor.registerUpdateListener(() => {
      this.updateMatchFromSelection(editor);
    });

    const handleEscape = (event: KeyboardEvent) => {
      if (this.isOpen && event.key === "Escape") {
        event.preventDefault();
        this.closeMenu();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".luthor-wikilink-typeahead")) {
        return;
      }
      if (this.isOpen) {
        this.closeMenu();
      }
    };

    const handleViewportChange = () => {
      if (!this.isOpen || !this.activeMatch) {
        return;
      }
      if (this.viewportRafId !== null) {
        return;
      }
      this.viewportRafId = window.requestAnimationFrame(() => {
        this.viewportRafId = null;
        const position = this.getCaretPosition();
        if (!position) {
          this.closeMenu();
          return;
        }
        this.position = position;
        this.notifyListeners();
      });
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      unregisterUpdate();
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
      if (this.viewportRafId !== null) {
        cancelAnimationFrame(this.viewportRafId);
        this.viewportRafId = null;
      }
      this.editor = null;
      this.activeMatch = null;
      this.isOpen = false;
      this.query = "";
      this.position = null;
      this.notifyListeners();
    };
  }

  getCommands(editor: LexicalEditor): WikilinkTypeaheadCommands {
    return {
      selectWikilink: (target: string, alias?: string) =>
        this.selectWikilink(editor, target, alias),
      closeWikilinkMenu: () => this.closeMenu(),
    };
  }

  getStateQueries(): WikilinkTypeaheadStateQueries {
    return {
      isWikilinkMenuOpen: () => Promise.resolve(this.isOpen),
    };
  }

  subscribe(
    listener: (state: WikilinkTypeaheadMenuState) => void,
  ): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((entry) => entry !== listener);
    };
  }

  private selectWikilink(
    editor: LexicalEditor,
    target: string,
    alias?: string,
  ): void {
    const match = this.activeMatch;
    if (!match) {
      return;
    }

    editor.update(() => {
      const targetNode = $getNodeByKey(match.nodeKey);
      if (!$isTextNode(targetNode)) {
        return;
      }

      const size = targetNode.getTextContentSize();
      const start = Math.max(0, Math.min(match.startOffset, size));
      const end = Math.max(start, Math.min(match.endOffset, size));

      targetNode.select(start, end);
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      selection.insertNodes([$createWikilinkNode(target, alias)]);
    });

    this.closeMenu();
  }

  private updateMatchFromSelection(editor: LexicalEditor): void {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        this.closeIfNeeded();
        return;
      }

      const anchorNode = selection.anchor.getNode();
      if (!$isTextNode(anchorNode)) {
        this.closeIfNeeded();
        return;
      }

      const containerType = getContainerType(anchorNode);
      if (!ALLOWED_CONTAINER_TYPES.has(containerType)) {
        this.closeIfNeeded();
        return;
      }

      const offset = selection.anchor.offset;
      const textContent = anchorNode.getTextContent();
      const textBeforeCursor = textContent.slice(0, offset);

      const triggerIndex = textBeforeCursor.lastIndexOf(TRIGGER);
      if (triggerIndex < 0) {
        this.closeIfNeeded();
        return;
      }

      // Don't trigger for `![[` (file embed syntax).
      if (triggerIndex > 0 && textBeforeCursor[triggerIndex - 1] === "!") {
        this.closeIfNeeded();
        return;
      }

      const query = textBeforeCursor.slice(triggerIndex + TRIGGER.length);

      // Close if the query already contains `]` or `|` — the wikilink is being
      // closed or aliased, both of which are handled by the markdown transformer.
      if (/[|\]]/.test(query)) {
        this.closeIfNeeded();
        return;
      }

      const position = this.getCaretPosition();
      this.isOpen = true;
      this.query = query;
      this.position = position;
      this.activeMatch = {
        nodeKey: anchorNode.getKey(),
        startOffset: triggerIndex,
        endOffset: offset,
        query,
      };
      this.notifyListeners();
    });
  }

  private closeMenu(): void {
    this.isOpen = false;
    this.query = "";
    this.position = null;
    this.activeMatch = null;
    this.notifyListeners();
  }

  private closeIfNeeded(): void {
    if (!this.isOpen && !this.activeMatch) {
      return;
    }
    this.closeMenu();
  }

  private getCaretPosition(): { x: number; y: number } | null {
    if (typeof window === "undefined") {
      return null;
    }

    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      return null;
    }

    const range = domSelection.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    const firstClientRect = range.getClientRects()[0];
    const safeRect = firstClientRect || rect;

    const xOffset = this.config.offset?.x ?? 0;
    const yOffset = this.config.offset?.y ?? 8;

    return {
      x: safeRect.left + xOffset,
      y: safeRect.bottom + yOffset,
    };
  }

  private getState(): WikilinkTypeaheadMenuState {
    return {
      isOpen: this.isOpen,
      query: this.query,
      position: this.position,
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const wikilinkTypeaheadExtension = new WikilinkTypeaheadExtension();

function getContainerType(node: {
  getTopLevelElementOrThrow?: () => { getType?: () => string };
}): string {
  try {
    const topLevelNode = node.getTopLevelElementOrThrow?.();
    return topLevelNode?.getType?.() ?? "";
  } catch {
    return "";
  }
}
