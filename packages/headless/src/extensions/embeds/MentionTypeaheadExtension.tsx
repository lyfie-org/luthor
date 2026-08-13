/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * `@` typeahead trigger for user mentions.
 *
 * Detects when the user starts an `@username` token and exposes a subscribable
 * state (query, position, open/closed) so the preset can render a people-search
 * dropdown. When a result is selected, the extension replaces the trigger text
 * with plain `@username ` — a mention is *text*, not a node: hosts detect
 * mentions by scanning the markdown body, so there is nothing to serialize and
 * nothing that can rewrite the body on save.
 *
 * The trigger deliberately matches the host-side detection rule
 * (`(?<=^|[\s(\[])@[A-Za-z0-9][A-Za-z0-9._-]{0,63}\b`): an `@` only opens the
 * menu at the start of a block or after whitespace, `(`, or `[`. Anything else —
 * most importantly the `@` inside `name@example.com` — is left alone, so the UI
 * never offers a suggestion the host would silently drop. How many characters
 * must follow the trigger is the host's call
 * ({@link MentionTypeaheadConfig.minQueryLength}, `0` by default so a bare `@`
 * opens the menu); the character rule itself is not configurable.
 *
 * The trigger only opens in a block that can carry a `^id` anchor — the host
 * resolves a mention to its block's anchor, so opening anywhere else would
 * invite a mention that cannot be delivered.
 *
 * Like {@link WikilinkTypeaheadExtension}, this extension is search-agnostic: it
 * never fetches people. The UI layer subscribes, runs the host's search, renders
 * the results, and calls `selectMention` with the chosen username. That keeps
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
import { ANCHORABLE_BLOCK_TYPES } from "./anchorableBlocks";

/** The subscribable state of the mention typeahead menu. */
export type MentionTypeaheadMenuState = {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number } | null;
};

export interface MentionTypeaheadConfig extends BaseExtensionConfig {
  offset?: { x: number; y: number };
  /**
   * How many characters must follow the `@` before the menu opens. Defaults to
   * `0`, so a bare `@` opens it — which is what a person expects when the
   * directory is small enough to browse, and what a host whose people endpoint
   * answers an empty query with a first page wants.
   *
   * Raise it to `1` (or more) for the opposite trade: a large directory where
   * an unfiltered dropdown is noise, or a body where a lone `@` is common
   * prose. Only the *length* floor is configurable — the character rule is
   * fixed, so the first character a username cannot contain still closes the
   * menu at any setting. Values below `0` are clamped.
   */
  minQueryLength?: number;
}

export type MentionTypeaheadCommands = {
  selectMention: (username: string) => void;
  closeMentionMenu: () => void;
};

export type MentionTypeaheadStateQueries = {
  isMentionMenuOpen: () => Promise<boolean>;
};

type TypeaheadMatch = {
  nodeKey: string;
  startOffset: number;
  endOffset: number;
  query: string;
};

const TRIGGER = "@";

/**
 * The typed query, mirroring the host's `name` group: starts alphanumeric, then
 * up to 63 more of `[A-Za-z0-9._-]`. The first disallowed character closes the
 * menu again. An empty query is length-checked separately against
 * {@link MentionTypeaheadConfig.minQueryLength} rather than by this pattern, so
 * the character rule stays identical at every setting.
 */
const QUERY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** A bare `@` opens the menu unless the host asks for a longer floor. */
const DEFAULT_MIN_QUERY_LENGTH = 0;

/** Characters an `@` may follow and still start a mention. */
const BOUNDARY_PATTERN = /[\s([]/;

/**
 * Where a mention may be typed. Shared with the block-anchor stamping pass:
 * a mention is delivered through the anchor of the block it sits in, so the
 * trigger must never open in a block that cannot carry one.
 */
const ALLOWED_CONTAINER_TYPES = ANCHORABLE_BLOCK_TYPES;

/**
 * Strip everything a username cannot contain. Suggestions come from the host's
 * people search, so the value is sanitized before it is written into the body —
 * an unexpected payload can never inject markdown syntax into the note.
 */
export function sanitizeMentionUsername(username: string): string {
  const match = /[A-Za-z0-9][A-Za-z0-9._-]{0,63}/.exec(username.trim());
  return match ? match[0] : "";
}

/**
 * Headless extension providing the `@` typeahead trigger for user mentions.
 * Subscribe to the menu state, render your own dropdown, and call
 * `selectMention` when the user picks someone.
 */
export class MentionTypeaheadExtension extends BaseExtension<
  "mentionTypeahead",
  MentionTypeaheadConfig,
  MentionTypeaheadCommands,
  MentionTypeaheadStateQueries
> {
  private listeners: ((state: MentionTypeaheadMenuState) => void)[] = [];
  private isOpen = false;
  private query = "";
  private position: { x: number; y: number } | null = null;
  private activeMatch: TypeaheadMatch | null = null;
  private editor: LexicalEditor | null = null;
  private viewportRafId: number | null = null;

  constructor(config: MentionTypeaheadConfig = {}) {
    super("mentionTypeahead", [ExtensionCategory.Floating]);
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
      if (target?.closest(".luthor-mention-typeahead")) {
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

  getCommands(editor: LexicalEditor): MentionTypeaheadCommands {
    return {
      selectMention: (username: string) => this.selectMention(editor, username),
      closeMentionMenu: () => this.closeMenu(),
    };
  }

  getStateQueries(): MentionTypeaheadStateQueries {
    return {
      isMentionMenuOpen: () => Promise.resolve(this.isOpen),
    };
  }

  subscribe(listener: (state: MentionTypeaheadMenuState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((entry) => entry !== listener);
    };
  }

  /**
   * Replace the `@query` the user typed with `@username ` (trailing space, so
   * the caret lands on a fresh word). Plain text by design — see the module
   * header.
   */
  private selectMention(editor: LexicalEditor, username: string): void {
    const match = this.activeMatch;
    if (!match) {
      return;
    }

    const safeUsername = sanitizeMentionUsername(username);
    if (!safeUsername) {
      this.closeMenu();
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
      selection.insertText(`${TRIGGER}${safeUsername} `);
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

      // The `@` must start a token: block start, or after whitespace/`(`/`[`.
      // This is what keeps `name@example.com` from opening the menu.
      const precedingChar = getPrecedingCharacter(anchorNode, textBeforeCursor, triggerIndex);
      if (precedingChar !== null && !BOUNDARY_PATTERN.test(precedingChar)) {
        this.closeIfNeeded();
        return;
      }

      const query = textBeforeCursor.slice(triggerIndex + TRIGGER.length);
      if (query.length < this.getMinQueryLength()) {
        this.closeIfNeeded();
        return;
      }
      if (query.length > 0 && !QUERY_PATTERN.test(query)) {
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

  /** The host's query-length floor, never below zero. */
  private getMinQueryLength(): number {
    return Math.max(0, this.config.minQueryLength ?? DEFAULT_MIN_QUERY_LENGTH);
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

  private getState(): MentionTypeaheadMenuState {
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

export const mentionTypeaheadExtension = new MentionTypeaheadExtension();

/**
 * The character immediately before the trigger, or `null` when the trigger
 * starts the block. When the `@` opens the anchor node, the preceding character
 * comes from the previous sibling's rendered text — a wikilink chip ends in `]`,
 * so `[[Note]]@name` correctly fails the boundary test.
 */
function getPrecedingCharacter(
  node: { getPreviousSibling?: () => { getTextContent?: () => string } | null },
  textBeforeCursor: string,
  triggerIndex: number,
): string | null {
  if (triggerIndex > 0) {
    return textBeforeCursor[triggerIndex - 1] ?? null;
  }

  const previousSibling = node.getPreviousSibling?.();
  const previousText = previousSibling?.getTextContent?.() ?? "";
  return previousText.length > 0
    ? (previousText[previousText.length - 1] ?? null)
    : null;
}

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
