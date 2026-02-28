import type { LuthorEditorThemeOverrides } from "@lyfie/luthor-headless";

export type CoreTheme = "light" | "dark";

export type CoreEditorMode = "visual" | "json";

export const BLOCK_HEADING_LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

export type BlockHeadingLevel = (typeof BLOCK_HEADING_LEVELS)[number];

export type BlockFormat = "p" | BlockHeadingLevel;

export type ImageAlignment = "left" | "center" | "right" | "none";

export type TextAlignment = "left" | "center" | "right" | "justify";

export interface InsertTableConfig {
  rows?: number;
  columns?: number;
  includeHeaders?: boolean;
}

export interface InsertImageConfig {
  src: string;
  alt: string;
  caption?: string;
  file?: File;
}

export interface CoreEditorCommands {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;
  formatText: (format: "code") => void;
  setFontFamily?: (fontValue: string) => void;
  clearFontFamily?: () => void;
  getCurrentFontFamily?: () => Promise<string | null>;
  getFontFamilyOptions?: () => readonly {
    value: string;
    label: string;
    fontFamily: string;
    cssImportUrl?: string;
  }[];
  setFontSize?: (fontSizeValue: string) => void;
  clearFontSize?: () => void;
  getCurrentFontSize?: () => Promise<string | null>;
  getFontSizeOptions?: () => readonly {
    value: string;
    label: string;
    fontSize: string;
  }[];
  setLineHeight?: (lineHeightValue: string) => void;
  clearLineHeight?: () => void;
  getCurrentLineHeight?: () => Promise<string | null>;
  getLineHeightOptions?: () => readonly {
    value: string;
    label: string;
    lineHeight: string;
  }[];
  setTextColor?: (colorValue: string) => void;
  clearTextColor?: () => void;
  getCurrentTextColor?: () => Promise<string | null>;
  getTextColorOptions?: () => readonly {
    value: string;
    label: string;
    color: string;
  }[];
  setTextHighlight?: (highlightValue: string) => void;
  clearTextHighlight?: () => void;
  getCurrentTextHighlight?: () => Promise<string | null>;
  getTextHighlightOptions?: () => readonly {
    value: string;
    label: string;
    backgroundColor: string;
  }[];
  toggleSubscript?: () => void;
  toggleSuperscript?: () => void;
  insertLink: () => void;
  updateLink?: (url: string, rel?: string, target?: string) => boolean;
  removeLink: () => void;
  getCurrentLink?: () => Promise<{
    url: string;
    rel: string | null;
    target: string | null;
  } | null>;
  getLinkByKey?: (linkNodeKey: string) => Promise<{
    url: string;
    rel: string | null;
    target: string | null;
  } | null>;
  updateLinkByKey?: (linkNodeKey: string, url: string, rel?: string, target?: string) => boolean;
  removeLinkByKey?: (linkNodeKey: string) => boolean;
  toggleParagraph: () => void;
  toggleHeading: (heading: BlockHeadingLevel) => void;
  toggleQuote: () => void;
  setTextAlignment: (alignment: TextAlignment) => void;
  toggleCodeBlock: () => void;
  setCodeLanguage?: (language: string) => void;
  autoDetectCodeLanguage?: () => Promise<string | null>;
  getCurrentCodeLanguage?: () => Promise<string | null>;
  getCodeLanguageOptions?: () => string[];
  copySelectedCodeBlock?: () => Promise<boolean>;
  toggleUnorderedList: () => void;
  toggleOrderedList: () => void;
  toggleCheckList: () => void;
  indentList: () => void;
  outdentList: () => void;
  insertHorizontalRule: () => void;
  insertTable: (config: InsertTableConfig) => void;
  insertImage: (config: InsertImageConfig) => void;
  insertEmoji?: (emoji: string) => void;
  insertCustomNode?: (payload: Record<string, unknown>) => void;
  executeEmojiSuggestion?: (emoji: string) => boolean;
  closeEmojiSuggestions?: () => void;
  getEmojiSuggestions?: (query?: string) => {
    emoji: string;
    label: string;
    shortcodes: string[];
    keywords?: string[];
  }[];
  getEmojiCatalog?: () => {
    emoji: string;
    label: string;
    shortcodes: string[];
    keywords?: string[];
  }[];
  resolveEmojiShortcode?: (shortcode: string) => {
    emoji: string;
    label: string;
    shortcodes: string[];
    keywords?: string[];
  } | null;
  setEmojiCatalog?: (
    catalog: {
      emoji: string;
      label: string;
      shortcodes: string[];
      keywords?: string[];
    }[],
  ) => void;
  setEmojiCatalogAdapter?: (adapter: {
    search: (query: string, options?: { limit?: number }) => {
      emoji: string;
      label: string;
      shortcodes: string[];
      keywords?: string[];
    }[];
    resolveShortcode: (shortcode: string) => {
      emoji: string;
      label: string;
      shortcodes: string[];
      keywords?: string[];
    } | null;
    getAll: () => {
      emoji: string;
      label: string;
      shortcodes: string[];
      keywords?: string[];
    }[];
  }) => void;
  getEmojiCatalogAdapter?: () => {
    search: (query: string, options?: { limit?: number }) => {
      emoji: string;
      label: string;
      shortcodes: string[];
      keywords?: string[];
    }[];
    resolveShortcode: (shortcode: string) => {
      emoji: string;
      label: string;
      shortcodes: string[];
      keywords?: string[];
    } | null;
    getAll: () => {
      emoji: string;
      label: string;
      shortcodes: string[];
      keywords?: string[];
    }[];
  };
  setImageAlignment: (alignment: ImageAlignment) => void;
  setImageCaption: (caption: string) => void;
  getImageCaption?: () => Promise<string>;
  insertIframeEmbed?: (inputUrl: string, width?: number, height?: number, title?: string) => void;
  setIframeEmbedAlignment?: (alignment: ImageAlignment) => void;
  resizeIframeEmbed?: (width: number, height: number) => void;
  setIframeEmbedCaption?: (caption: string) => void;
  getIframeEmbedCaption?: () => Promise<string>;
  updateIframeEmbedUrl?: (inputUrl: string) => boolean;
  getIframeEmbedUrl?: () => Promise<string>;
  insertYouTubeEmbed?: (inputUrl: string, width?: number, height?: number, start?: number) => void;
  setYouTubeEmbedAlignment?: (alignment: ImageAlignment) => void;
  resizeYouTubeEmbed?: (width: number, height: number) => void;
  setYouTubeEmbedCaption?: (caption: string) => void;
  getYouTubeEmbedCaption?: () => Promise<string>;
  updateYouTubeEmbedUrl?: (inputUrl: string) => boolean;
  getYouTubeEmbedUrl?: () => Promise<string>;
  undo: () => void;
  redo: () => void;
  showCommandPalette: () => void;
  hideCommandPalette: () => void;
  registerCommand: (command: Record<string, unknown>) => void;
  unregisterCommand: (commandId: string) => void;
  registerSlashCommand?: (command: Record<string, unknown>) => void;
  unregisterSlashCommand?: (commandId: string) => void;
  setSlashCommands?: (commands: Record<string, unknown>[]) => void;
  closeSlashMenu?: () => void;
  executeSlashCommand?: (commandId: string) => boolean;
}

export interface CoreEditorActiveStates {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  hasCustomFontFamily?: boolean;
  hasCustomFontSize?: boolean;
  hasCustomLineHeight?: boolean;
  hasCustomTextColor?: boolean;
  hasTextHighlight?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  isLink?: boolean;
  isQuote?: boolean;
  isInCodeBlock?: boolean;
  unorderedList?: boolean;
  orderedList?: boolean;
  checkList?: boolean;
  isH1?: boolean;
  isH2?: boolean;
  isH3?: boolean;
  isH4?: boolean;
  isH5?: boolean;
  isH6?: boolean;
  isTextAlignedLeft?: boolean;
  isTextAlignedCenter?: boolean;
  isTextAlignedRight?: boolean;
  isTextAlignedJustify?: boolean;
  imageSelected?: boolean;
  isImageAlignedLeft?: boolean;
  isImageAlignedCenter?: boolean;
  isImageAlignedRight?: boolean;
  isIframeEmbedSelected?: boolean;
  isIframeEmbedAlignedLeft?: boolean;
  isIframeEmbedAlignedCenter?: boolean;
  isIframeEmbedAlignedRight?: boolean;
  isYouTubeEmbedSelected?: boolean;
  isYouTubeEmbedAlignedLeft?: boolean;
  isYouTubeEmbedAlignedCenter?: boolean;
  isYouTubeEmbedAlignedRight?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export interface CoreToolbarClassNames {
  toolbar?: string;
  section?: string;
}

export type ToolbarStyleVars = Partial<{
  "--luthor-toolbar-bg": string;
  "--luthor-toolbar-section-border": string;
  "--luthor-toolbar-button-fg": string;
  "--luthor-toolbar-button-hover-bg": string;
  "--luthor-toolbar-button-hover-border": string;
  "--luthor-toolbar-button-hover-shadow": string;
  "--luthor-toolbar-button-press-shadow": string;
  "--luthor-toolbar-button-active-bg": string;
  "--luthor-toolbar-button-active-border": string;
  "--luthor-toolbar-button-active-fg": string;
  "--luthor-toolbar-button-active-shadow": string;
  "--luthor-toolbar-button-overlay": string;
  "--luthor-toolbar-button-active-overlay": string;
  "--luthor-toolbar-color-indicator-border": string;
  "--luthor-toolbar-highlight-bg": string;
}>;

export type QuoteStyleVars = Partial<{
  "--luthor-quote-bg": string;
  "--luthor-quote-fg": string;
  "--luthor-quote-border": string;
}>;

export interface DefaultSettings {
  font?: {
    color?: string;
    boldColor?: string;
  };
  link?: {
    color?: string;
  };
  list?: {
    markerColor?: string;
    checkboxColor?: string;
  };
  quote?: {
    backgroundColor?: string;
    color?: string;
    indicatorColor?: string;
  };
  table?: {
    borderColor?: string;
    headerBackgroundColor?: string;
  };
  hr?: {
    color?: string;
  };
  placeholder?: {
    color?: string;
  };
  codeblock?: {
    backgroundColor?: string;
  };
  toolbar?: {
    backgroundColor?: string;
  };
}

export type EditorThemeOverrides = LuthorEditorThemeOverrides;

export type ToolbarPosition = "top" | "bottom";

export type ToolbarAlignment = "left" | "center" | "right";

export type ToolbarItemType =
  // Typography
  | "fontFamily"
  | "fontSize"
  | "lineHeight"
  | "textColor"
  | "textHighlight"
  // Basic Formatting
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  // Enhanced Formatting
  | "subscript"
  | "superscript"
  | "code"
  | "link"
  // Block Format
  | "blockFormat"
  | "quote"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustify"
  | "codeBlock"
  // Lists
  | "unorderedList"
  | "orderedList"
  | "checkList"
  | "indentList"
  | "outdentList"
  // Insert
  | "horizontalRule"
  | "table"
  | "image"
  | "emoji"
  | "embed"
  | "customComponent"
  // History
  | "undo"
  | "redo"
  // Utilities
  | "commandPalette"
  | "themeToggle";

export type ToolbarVisibility = Partial<Record<ToolbarItemType, boolean>>;

export interface SlashCommandVisibilityFilters {
  allowlist?: readonly string[];
  denylist?: readonly string[];
}

export type SlashCommandVisibilitySelection = Readonly<Record<string, boolean>>;

export type SlashCommandVisibility =
  | SlashCommandVisibilityFilters
  | readonly SlashCommandVisibilitySelection[];

export type ToolbarSection = {
  items: readonly ToolbarItemType[];
};

export type ToolbarLayout = {
  sections: readonly ToolbarSection[];
};

export const DEFAULT_TOOLBAR_LAYOUT: ToolbarLayout = {
  sections: [
    {
      items: ["fontFamily", "fontSize", "lineHeight", "textColor", "textHighlight", "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "code", "link"],
    },
    {
      items: ["blockFormat", "quote", "alignLeft", "alignCenter", "alignRight", "alignJustify", "codeBlock"],
    },
    {
      items: ["unorderedList", "orderedList", "checkList", "indentList", "outdentList"],
    },
    {
      items: ["horizontalRule"],
    },
    {
      items: ["table"],
    },
    {
      items: ["image"],
    },
    {
      items: ["emoji"],
    },
    {
      items: ["embed"],
    },
    {
      items: ["customComponent"],
    },
    {
      items: ["undo", "redo"],
    },
    {
      items: ["commandPalette"],
    },
    {
      items: ["themeToggle"],
    },
  ],
};

export const TRADITIONAL_TOOLBAR_LAYOUT: ToolbarLayout = {
  sections: [
    {
      items: ["undo", "redo"],
    },
    {
      items: ["fontFamily", "blockFormat", "fontSize", "lineHeight"],
    },
    {
      items: ["bold", "italic", "underline", "strikethrough", "textColor", "textHighlight"],
    },
    {
      items: ["alignLeft", "alignCenter", "alignRight", "alignJustify"],
    },
    {
      items: ["unorderedList", "orderedList", "checkList", "indentList", "outdentList"],
    },
    {
      items: ["link"],
    },
    {
      items: ["image", "table", "code", "codeBlock", "horizontalRule", "quote"],
    },
    {
      items: ["subscript", "superscript", "emoji", "embed", "customComponent"],
    },
    {
      items: ["commandPalette", "themeToggle"],
    },
  ],
};
