import {
  $isCodeNode,
} from "@lexical/code";
import {
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
  LexicalNode,
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

export type EmojiCatalogAdapter = {
  search: (query: string, options?: { limit?: number }) => EmojiCatalogItem[];
  resolveShortcode: (shortcode: string) => EmojiCatalogItem | null;
  getAll: () => EmojiCatalogItem[];
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
  catalogAdapter?: EmojiCatalogAdapter;
  autoDetectExternalCatalog?: boolean;
  offset?: { x: number; y: number };
}

export type EmojiCommands = {
  insertEmoji: (emoji: string) => void;
  executeEmojiSuggestion: (emoji: string) => boolean;
  closeEmojiSuggestions: () => void;
  getEmojiSuggestions: (query?: string) => EmojiCatalogItem[];
  getEmojiCatalog: () => EmojiCatalogItem[];
  resolveEmojiShortcode: (shortcode: string) => EmojiCatalogItem | null;
  setEmojiCatalog: (catalog: EmojiCatalogItem[]) => void;
  setEmojiCatalogAdapter: (adapter: EmojiCatalogAdapter) => void;
  getEmojiCatalogAdapter: () => EmojiCatalogAdapter;
};

export type EmojiStateQueries = {
  isEmojiSuggestionOpen: () => Promise<boolean>;
};

type EmojiMatch = {
  nodeKey: string;
  startOffset: number;
  endOffset: number;
};

export const LIGHTWEIGHT_EMOJI_CATALOG: EmojiCatalogItem[] = [
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

const DEFAULT_EMOJI_CATALOG = LIGHTWEIGHT_EMOJI_CATALOG;

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

function normalizeShortcode(value: string): string {
  return value.trim().toLowerCase().replace(/^:+|:+$/g, "");
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createStaticCatalogAdapter(catalog: readonly EmojiCatalogItem[]): EmojiCatalogAdapter {
  const stableCatalog = catalog.map((item) => ({
    ...item,
    shortcodes: [...item.shortcodes],
    keywords: item.keywords ? [...item.keywords] : undefined,
  }));

  const shortcodeIndex = new Map<string, EmojiCatalogItem>();
  const searchRows = stableCatalog.map((item) => {
    const shortcodes = (item.shortcodes || []).map((entry) => normalizeShortcode(entry)).filter(Boolean);
    for (const shortcode of shortcodes) {
      if (!shortcodeIndex.has(shortcode)) {
        shortcodeIndex.set(shortcode, item);
      }
    }

    const searchable = normalizeSearchText([
      item.label,
      ...shortcodes,
      ...(item.keywords || []),
    ].join(" "));

    return {
      item,
      searchable,
    };
  });

  return {
    getAll: () => [...stableCatalog],
    resolveShortcode: (shortcode: string) => {
      return shortcodeIndex.get(normalizeShortcode(shortcode)) ?? null;
    },
    search: (query: string, options?: { limit?: number }) => {
      const limit = Math.max(0, options?.limit ?? stableCatalog.length);
      if (limit === 0) {
        return [];
      }

      const normalizedQuery = normalizeSearchText(query);
      if (!normalizedQuery) {
        return stableCatalog.slice(0, limit);
      }
      return searchRows
        .filter((row) => row.searchable.includes(normalizedQuery))
        .slice(0, limit)
        .map((row) => row.item);
    },
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function parseEmojiMartShortcodes(entry: Record<string, unknown>): string[] {
  const fromArray = toStringArray(entry.shortcodes);
  if (fromArray.length > 0) {
    return fromArray.map((item) => normalizeShortcode(item));
  }

  if (typeof entry.shortcodes === "string") {
    return entry.shortcodes
      .split(/[,\s]+/)
      .map((item) => normalizeShortcode(item))
      .filter(Boolean);
  }

  return [];
}

function createEmojiMartAdapterFromUnknownData(
  rawData: unknown,
): EmojiCatalogAdapter | null {
  if (!rawData || typeof rawData !== "object") {
    return null;
  }

  const data = rawData as { emojis?: Record<string, unknown> };
  if (!data.emojis || typeof data.emojis !== "object") {
    return null;
  }

  const items: EmojiCatalogItem[] = [];

  for (const [id, rawEntry] of Object.entries(data.emojis)) {
    if (!rawEntry || typeof rawEntry !== "object") {
      continue;
    }

    const entry = rawEntry as Record<string, unknown>;
    const name = typeof entry.name === "string" && entry.name.trim().length > 0
      ? entry.name.trim()
      : id;
    const skins = Array.isArray(entry.skins) ? entry.skins : [];
    const firstSkin = skins[0] as { native?: unknown } | undefined;
    const emoji = typeof firstSkin?.native === "string" ? firstSkin.native : "";
    if (!emoji) {
      continue;
    }

    const shortcodes = Array.from(
      new Set([
        normalizeShortcode(id),
        ...parseEmojiMartShortcodes(entry),
      ].filter(Boolean)),
    );

    if (shortcodes.length === 0) {
      continue;
    }

    items.push({
      emoji,
      label: name,
      shortcodes,
      keywords: toStringArray(entry.keywords),
    });
  }

  if (items.length === 0) {
    return null;
  }

  return createStaticCatalogAdapter(items);
}

async function dynamicImport(moduleName: string): Promise<unknown> {
  const importer = new Function(
    "name",
    "return import(name);",
  ) as (name: string) => Promise<unknown>;
  return importer(moduleName);
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
  private catalogAdapter: EmojiCatalogAdapter = createStaticCatalogAdapter(
    DEFAULT_EMOJI_CATALOG,
  );
  private hasExplicitCatalogConfig = false;
  private hasExplicitAdapterConfig = false;
  private externalCatalogDetectionStarted = false;

  constructor(config: EmojiConfig = {}) {
    super("emoji", [ExtensionCategory.Toolbar]);
    this.hasExplicitCatalogConfig = Object.prototype.hasOwnProperty.call(
      config,
      "catalog",
    );
    this.hasExplicitAdapterConfig = Object.prototype.hasOwnProperty.call(
      config,
      "catalogAdapter",
    );
    this.config = {
      trigger: ":",
      maxSuggestions: 8,
      maxQueryLength: 32,
      autoReplaceSymbols: true,
      symbolReplacements: DEFAULT_SYMBOL_REPLACEMENTS,
      autoDetectExternalCatalog: true,
      offset: { x: 0, y: 8 },
      ...config,
    };
    this.catalogAdapter = this.resolveCatalogAdapter(this.config);
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
    if (Object.prototype.hasOwnProperty.call(config, "catalog")) {
      this.hasExplicitCatalogConfig = true;
    }
    if (Object.prototype.hasOwnProperty.call(config, "catalogAdapter")) {
      this.hasExplicitAdapterConfig = true;
    }
    this.catalogAdapter = this.resolveCatalogAdapter(this.config);
    if (this.isOpen) {
      this.suggestions = this.getSuggestions(this.query);
      this.isOpen = this.suggestions.length > 0;
      this.notifyListeners();
    }
    return this;
  }

  register(editor: LexicalEditor): () => void {
    void this.tryEnableExternalCatalog();

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
      resolveEmojiShortcode: (shortcode: string) => this.resolveShortcode(shortcode),
      setEmojiCatalog: (catalog: EmojiCatalogItem[]) => {
        this.hasExplicitCatalogConfig = true;
        this.hasExplicitAdapterConfig = false;
        this.config = { ...this.config, catalog: [...catalog], catalogAdapter: undefined };
        this.catalogAdapter = this.resolveCatalogAdapter(this.config);
        if (this.isOpen) {
          this.suggestions = this.getSuggestions(this.query);
          this.isOpen = this.suggestions.length > 0;
          this.notifyListeners();
        }
      },
      setEmojiCatalogAdapter: (adapter: EmojiCatalogAdapter) => {
        this.hasExplicitAdapterConfig = true;
        this.config = { ...this.config, catalogAdapter: adapter };
        this.catalogAdapter = this.resolveCatalogAdapter(this.config);
        if (this.isOpen) {
          this.suggestions = this.getSuggestions(this.query);
          this.isOpen = this.suggestions.length > 0;
          this.notifyListeners();
        }
      },
      getEmojiCatalogAdapter: () => this.catalogAdapter,
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
    return this.catalogAdapter.getAll();
  }

  private getSuggestions(query: string): EmojiCatalogItem[] {
    const maxSuggestions = this.config.maxSuggestions ?? 8;
    return this.catalogAdapter.search(query, { limit: maxSuggestions });
  }

  private resolveShortcode(shortcode: string): EmojiCatalogItem | null {
    return this.catalogAdapter.resolveShortcode(shortcode);
  }

  private resolveCatalogAdapter(config: EmojiConfig): EmojiCatalogAdapter {
    if (config.catalogAdapter) {
      return config.catalogAdapter;
    }
    return createStaticCatalogAdapter(config.catalog || DEFAULT_EMOJI_CATALOG);
  }

  private async tryEnableExternalCatalog(): Promise<void> {
    if (this.externalCatalogDetectionStarted) {
      return;
    }
    this.externalCatalogDetectionStarted = true;

    if (!this.config.autoDetectExternalCatalog) {
      return;
    }
    if (this.hasExplicitCatalogConfig || this.hasExplicitAdapterConfig) {
      return;
    }

    const globalData =
      (globalThis as Record<string, unknown>).__EMOJI_MART_DATA__ ||
      ((globalThis as Record<string, unknown>).EmojiMart as Record<string, unknown> | undefined)?.data;
    const fromGlobal = createEmojiMartAdapterFromUnknownData(globalData);
    if (fromGlobal) {
      this.catalogAdapter = fromGlobal;
      this.refreshSuggestionsIfOpen();
      return;
    }

    try {
      const imported = await dynamicImport("@emoji-mart/data");
      const moduleRecord = imported as {
        default?: unknown;
        data?: unknown;
      };
      const adapter =
        createEmojiMartAdapterFromUnknownData(moduleRecord.default) ||
        createEmojiMartAdapterFromUnknownData(moduleRecord.data);
      if (adapter) {
        this.catalogAdapter = adapter;
        this.refreshSuggestionsIfOpen();
      }
    } catch {
      // No external emoji library detected; keep built-in fallback adapter.
    }
  }

  private refreshSuggestionsIfOpen() {
    if (!this.isOpen) {
      return;
    }
    this.suggestions = this.getSuggestions(this.query);
    this.isOpen = this.suggestions.length > 0;
    this.notifyListeners();
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

      if (this.isSelectionInsideCodeBlock(selection)) {
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

  private isSelectionInsideCodeBlock(selection: ReturnType<typeof $getSelection>): boolean {
    if (!$isRangeSelection(selection)) {
      return false;
    }

    let current: LexicalNode | null = selection.anchor.getNode();
    while (current) {
      if ($isCodeNode(current)) {
        return true;
      }
      current = current.getParent();
    }

    return false;
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
