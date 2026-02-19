import {
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
  PASTE_COMMAND,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
} from "lexical";
import React from "react";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { BaseExtensionConfig, ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";

export type EmojiCatalogItem = {
  emoji: string;
  label: string;
  shortcodes: string[];
  keywords?: string[];
};

export type EmojiSuggestionState = {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number } | null;
  suggestions: EmojiCatalogItem[];
};

export interface EmojiConfig extends BaseExtensionConfig {
  trigger?: string;
  maxSuggestions?: number;
  maxQueryLength?: number;
  autoReplaceSymbols?: boolean;
  symbolReplacements?: Record<string, string>;
  catalog?: EmojiCatalogItem[];
  offset?: { x: number; y: number };
}

export type EmojiCommands = {
  insertEmoji: (emoji: string) => void;
  executeEmojiSuggestion: (emoji: string) => boolean;
  closeEmojiSuggestions: () => void;
  getEmojiSuggestions: (query?: string) => EmojiCatalogItem[];
  getEmojiCatalog: () => EmojiCatalogItem[];
};

export type EmojiStateQueries = {
  isEmojiSuggestionOpen: () => Promise<boolean>;
};

type EmojiMatch = {
  nodeKey: string;
  startOffset: number;
  endOffset: number;
};

const DEFAULT_EMOJI_CATALOG: EmojiCatalogItem[] = [
  { emoji: "😀", label: "Grinning Face", shortcodes: ["grinning"], keywords: ["happy", "smile"] },
  { emoji: "😄", label: "Smile", shortcodes: ["smile"], keywords: ["happy", "joy"] },
  { emoji: "😊", label: "Blush", shortcodes: ["blush"], keywords: ["warm", "happy"] },
  { emoji: "😉", label: "Wink", shortcodes: ["wink"], keywords: ["playful"] },
  { emoji: "😍", label: "Heart Eyes", shortcodes: ["heart_eyes"], keywords: ["love"] },
  { emoji: "😘", label: "Kiss", shortcodes: ["kiss"], keywords: ["love"] },
  { emoji: "🤔", label: "Thinking", shortcodes: ["thinking"], keywords: ["hmm"] },
  { emoji: "😎", label: "Cool", shortcodes: ["sunglasses"], keywords: ["cool"] },
  { emoji: "😭", label: "Loudly Crying", shortcodes: ["sob"], keywords: ["cry", "sad"] },
  { emoji: "😢", label: "Crying", shortcodes: ["cry"], keywords: ["sad"] },
  { emoji: "😡", label: "Pouting", shortcodes: ["rage"], keywords: ["angry"] },
  { emoji: "😮", label: "Open Mouth", shortcodes: ["open_mouth"], keywords: ["surprised"] },
  { emoji: "👍", label: "Thumbs Up", shortcodes: ["thumbsup", "+1"], keywords: ["approve"] },
  { emoji: "👎", label: "Thumbs Down", shortcodes: ["thumbsdown", "-1"], keywords: ["disapprove"] },
  { emoji: "👏", label: "Clap", shortcodes: ["clap"], keywords: ["applause"] },
  { emoji: "🙏", label: "Folded Hands", shortcodes: ["pray"], keywords: ["thanks"] },
  { emoji: "🔥", label: "Fire", shortcodes: ["fire"], keywords: ["lit", "hot"] },
  { emoji: "✨", label: "Sparkles", shortcodes: ["sparkles"], keywords: ["shine"] },
  { emoji: "🎉", label: "Party Popper", shortcodes: ["tada"], keywords: ["celebrate"] },
  { emoji: "❤️", label: "Red Heart", shortcodes: ["heart"], keywords: ["love"] },
  { emoji: "💯", label: "Hundred", shortcodes: ["100"], keywords: ["perfect"] },
  { emoji: "✅", label: "Check Mark", shortcodes: ["white_check_mark"], keywords: ["done"] },
  { emoji: "🚀", label: "Rocket", shortcodes: ["rocket"], keywords: ["launch"] },
  { emoji: "🤝", label: "Handshake", shortcodes: ["handshake"], keywords: ["agreement"] },
  { emoji: "🎯", label: "Target", shortcodes: ["dart"], keywords: ["goal"] },
  { emoji: "💡", label: "Light Bulb", shortcodes: ["bulb"], keywords: ["idea"] },
  { emoji: "🧠", label: "Brain", shortcodes: ["brain"], keywords: ["think"] },
  { emoji: "🛠️", label: "Hammer and Wrench", shortcodes: ["tools"], keywords: ["build"] },
  { emoji: "📌", label: "Pushpin", shortcodes: ["pushpin"], keywords: ["pin"] },
  { emoji: "📎", label: "Paperclip", shortcodes: ["paperclip"], keywords: ["attach"] },
  { emoji: "📅", label: "Calendar", shortcodes: ["calendar"], keywords: ["date"] },
  { emoji: "📝", label: "Memo", shortcodes: ["memo"], keywords: ["note"] },
  { emoji: "💬", label: "Speech Balloon", shortcodes: ["speech_balloon"], keywords: ["comment"] },
  { emoji: "📷", label: "Camera", shortcodes: ["camera"], keywords: ["photo"] },
  { emoji: "🎬", label: "Clapper Board", shortcodes: ["clapper"], keywords: ["video", "gif"] },
];

const DEFAULT_SYMBOL_REPLACEMENTS: Record<string, string> = {
  ":)": "😊",
  ":(": "🙁",
  ":D": "😄",
  ";)": "😉",
  ":P": "😛",
  ":p": "😛",
  ":O": "😮",
  ":o": "😮",
  ":|": "😐",
  ":/": "😕",
  ":'(": "😢",
  "<3": "❤️",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class EmojiExtension extends BaseExtension<
  "emoji",
  EmojiConfig,
  EmojiCommands,
  EmojiStateQueries,
  React.ReactElement[]
> {
  private listeners: ((state: EmojiSuggestionState) => void)[] = [];
  private isOpen = false;
  private query = "";
  private position: { x: number; y: number } | null = null;
  private suggestions: EmojiCatalogItem[] = [];
  private activeMatch: EmojiMatch | null = null;
  private applyingAutoReplace = false;

  constructor(config: EmojiConfig = {}) {
    super("emoji", [ExtensionCategory.Toolbar]);
    this.config = {
      trigger: ":",
      maxSuggestions: 8,
      maxQueryLength: 32,
      autoReplaceSymbols: true,
      symbolReplacements: DEFAULT_SYMBOL_REPLACEMENTS,
      catalog: DEFAULT_EMOJI_CATALOG,
      offset: { x: 0, y: 8 },
      ...config,
    };
  }

  configure(config: Partial<EmojiConfig>): this {
    this.config = {
      ...this.config,
      ...config,
      symbolReplacements: {
        ...(this.config.symbolReplacements || DEFAULT_SYMBOL_REPLACEMENTS),
        ...(config.symbolReplacements || {}),
      },
    };
    return this;
  }

  register(editor: LexicalEditor): () => void {
    const unregisterUpdate = editor.registerUpdateListener(() => {
      this.updateFromSelection(editor);
    });

    const unregisterPaste = editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        if (!this.config.autoReplaceSymbols) {
          return false;
        }

        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        const plainText = clipboardData.getData("text/plain");
        const htmlText = clipboardData.getData("text/html");

        if (!plainText || htmlText) {
          return false;
        }

        const replacedText = this.replaceSymbolsInText(plainText);
        if (replacedText === plainText) {
          return false;
        }

        event.preventDefault();
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(replacedText);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    const handleEscape = (event: KeyboardEvent) => {
      if (!this.isOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this.closeEmojiSuggestions();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".luthor-emoji-menu")) {
        return;
      }

      if (this.isOpen) {
        this.closeEmojiSuggestions();
      }
    };

    const handleViewportChange = () => {
      if (!this.isOpen || !this.activeMatch) {
        return;
      }

      const nextPosition = this.getCaretPosition();
      if (!nextPosition) {
        this.closeEmojiSuggestions();
        return;
      }

      this.position = nextPosition;
      this.notifyListeners();
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      unregisterUpdate();
      unregisterPaste();
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
      this.activeMatch = null;
      this.isOpen = false;
      this.query = "";
      this.position = null;
      this.suggestions = [];
      this.notifyListeners();
    };
  }

  getCommands(editor: LexicalEditor): EmojiCommands {
    return {
      insertEmoji: (emoji: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(emoji);
          }
        });
      },
      executeEmojiSuggestion: (emoji: string) => this.executeEmojiSuggestion(editor, emoji),
      closeEmojiSuggestions: () => this.closeEmojiSuggestions(),
      getEmojiSuggestions: (query = "") => this.getSuggestions(query),
      getEmojiCatalog: () => this.getCatalog(),
    };
  }

  getStateQueries(editor: LexicalEditor): EmojiStateQueries {
    void editor;
    return {
      isEmojiSuggestionOpen: () => Promise.resolve(this.isOpen),
    };
  }

  subscribe(listener: (state: EmojiSuggestionState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((entry) => entry !== listener);
    };
  }

  private getCatalog(): EmojiCatalogItem[] {
    return [...(this.config.catalog || DEFAULT_EMOJI_CATALOG)];
  }

  private getSuggestions(query: string): EmojiCatalogItem[] {
    const normalizedQuery = query.trim().toLowerCase();
    const catalog = this.getCatalog();
    const maxSuggestions = this.config.maxSuggestions ?? 8;

    if (!normalizedQuery) {
      return catalog.slice(0, maxSuggestions);
    }

    return catalog
      .filter((item) => {
        const searchable = [
          item.label,
          ...(item.shortcodes || []),
          ...(item.keywords || []),
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .slice(0, maxSuggestions);
  }

  private updateFromSelection(editor: LexicalEditor) {
    let pendingReplacement:
      | {
          nodeKey: string;
          startOffset: number;
          endOffset: number;
          emoji: string;
        }
      | null = null;

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

      const offset = selection.anchor.offset;
      const textContent = anchorNode.getTextContent();
      const textBeforeCursor = textContent.slice(0, offset);

      if (this.config.autoReplaceSymbols && !this.applyingAutoReplace) {
        const symbolReplacement = this.detectSymbolReplacement(
          textContent,
          textBeforeCursor,
          offset,
        );
        if (symbolReplacement) {
          pendingReplacement = {
            nodeKey: anchorNode.getKey(),
            startOffset: symbolReplacement.startOffset,
            endOffset: symbolReplacement.endOffset,
            emoji: symbolReplacement.emoji,
          };
        }
      }

      const trigger = this.config.trigger || ":";
      const triggerIndex = textBeforeCursor.lastIndexOf(trigger);
      if (triggerIndex < 0) {
        this.closeIfNeeded();
        return;
      }

      const prefix = textBeforeCursor.slice(0, triggerIndex);
      const isAtWordBoundary = prefix.length === 0 || /\s/.test(prefix[prefix.length - 1] || "");
      if (!isAtWordBoundary) {
        this.closeIfNeeded();
        return;
      }

      const query = textBeforeCursor.slice(triggerIndex + trigger.length);
      if (/\s/.test(query) || query.length > (this.config.maxQueryLength ?? 32)) {
        this.closeIfNeeded();
        return;
      }

      const suggestions = this.getSuggestions(query);
      const position = this.getCaretPosition();

      this.query = query;
      this.position = position;
      this.suggestions = suggestions;
      this.isOpen = suggestions.length > 0;
      this.activeMatch = {
        nodeKey: anchorNode.getKey(),
        startOffset: triggerIndex,
        endOffset: offset,
      };
      this.notifyListeners();
    });

    if (pendingReplacement !== null) {
      const replacement: {
        nodeKey: string;
        startOffset: number;
        endOffset: number;
        emoji: string;
      } = pendingReplacement;
      this.applyingAutoReplace = true;
      editor.update(() => {
        const targetNode = $getNodeByKey(replacement.nodeKey);
        if (!$isTextNode(targetNode)) {
          return;
        }

        const deleteLength = Math.max(
          0,
          replacement.endOffset - replacement.startOffset,
        );
        targetNode.spliceText(
          replacement.startOffset,
          deleteLength,
          replacement.emoji,
          true,
        );
        const nextOffset = replacement.startOffset + replacement.emoji.length;
        targetNode.select(nextOffset, nextOffset);
      });
      this.applyingAutoReplace = false;
    }
  }

  private detectSymbolReplacement(
    fullText: string,
    textBeforeCursor: string,
    cursorOffset: number,
  ): { startOffset: number; endOffset: number; emoji: string } | null {
    const replacements = Object.entries(
      this.config.symbolReplacements || DEFAULT_SYMBOL_REPLACEMENTS,
    ).sort((a, b) => b[0].length - a[0].length);

    for (const [symbol, emoji] of replacements) {
      if (!textBeforeCursor.endsWith(symbol)) {
        continue;
      }

      const startOffset = cursorOffset - symbol.length;
      const previousChar = startOffset > 0 ? fullText[startOffset - 1] || "" : "";
      const nextChar = cursorOffset < fullText.length ? fullText[cursorOffset] || "" : "";
      const validBefore = startOffset === 0 || /\s|[([{>"'`]/.test(previousChar);
      const validAfter = cursorOffset === fullText.length || /\s|[.,!?;:)\]}"'`]/.test(nextChar);

      if (validBefore && validAfter) {
        return {
          startOffset,
          endOffset: cursorOffset,
          emoji,
        };
      }
    }

    return null;
  }

  private replaceSymbolsInText(text: string): string {
    const replacements = Object.entries(
      this.config.symbolReplacements || DEFAULT_SYMBOL_REPLACEMENTS,
    );
    let output = text;

    for (const [symbol, emoji] of replacements) {
      const escapedSymbol = escapeRegExp(symbol);
      const pattern = new RegExp(`(^|\\s)${escapedSymbol}(?=$|\\s|[.,!?;:])`, "g");
      output = output.replace(pattern, `$1${emoji}`);
    }

    return output;
  }

  private executeEmojiSuggestion(editor: LexicalEditor, emoji: string): boolean {
    if (!emoji) {
      return false;
    }

    if (this.activeMatch) {
      const match = this.activeMatch;
      editor.update(() => {
        const targetNode = $getNodeByKey(match.nodeKey);
        if (!$isTextNode(targetNode)) {
          return;
        }

        const deleteLength = Math.max(0, match.endOffset - match.startOffset);
        targetNode.spliceText(match.startOffset, deleteLength, emoji, true);
        const nextOffset = match.startOffset + emoji.length;
        targetNode.select(nextOffset, nextOffset);
      });
      this.closeEmojiSuggestions();
      return true;
    }

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(emoji);
      }
    });
    this.closeEmojiSuggestions();
    return true;
  }

  private closeEmojiSuggestions() {
    this.isOpen = false;
    this.query = "";
    this.position = null;
    this.suggestions = [];
    this.activeMatch = null;
    this.notifyListeners();
  }

  private closeIfNeeded() {
    if (!this.isOpen && !this.activeMatch) {
      return;
    }
    this.closeEmojiSuggestions();
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

    return {
      x: safeRect.left + (this.config.offset?.x ?? 0),
      y: safeRect.bottom + (this.config.offset?.y ?? 8),
    };
  }

  private getState(): EmojiSuggestionState {
    return {
      isOpen: this.isOpen,
      query: this.query,
      position: this.position,
      suggestions: this.suggestions,
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}

export const emojiExtension = new EmojiExtension();
export default emojiExtension;
