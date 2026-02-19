export type CoreTheme = "light" | "dark";

export type CoreEditorMode = "visual" | "html" | "markdown";

export type BlockHeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

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
  removeLink: () => void;
  toggleParagraph: () => void;
  toggleHeading: (heading: BlockHeadingLevel) => void;
  toggleQuote: () => void;
  setTextAlignment: (alignment: TextAlignment) => void;
  toggleCodeBlock: () => void;
  setCodeLanguage?: (language: string) => void;
  autoDetectCodeLanguage?: () => Promise<string | null>;
  getCurrentCodeLanguage?: () => Promise<string | null>;
  getCodeLanguageOptions?: () => string[];
  toggleUnorderedList: () => void;
  toggleOrderedList: () => void;
  toggleCheckList: () => void;
  indentList: () => void;
  outdentList: () => void;
  insertHorizontalRule: () => void;
  insertTable: (config: InsertTableConfig) => void;
  insertImage: (config: InsertImageConfig) => void;
  setImageAlignment: (alignment: ImageAlignment) => void;
  setImageCaption: (caption: string) => void;
  insertIframeEmbed?: (inputUrl: string, width?: number, height?: number, title?: string) => void;
  setIframeEmbedAlignment?: (alignment: ImageAlignment) => void;
  resizeIframeEmbed?: (width: number, height: number) => void;
  insertYouTubeEmbed?: (inputUrl: string, width?: number, height?: number, start?: number) => void;
  setYouTubeEmbedAlignment?: (alignment: ImageAlignment) => void;
  resizeYouTubeEmbed?: (width: number, height: number) => void;
  insertHTMLEmbed: (html?: string) => void;
  toggleHTMLPreview: () => void;
  undo: () => void;
  redo: () => void;
  showCommandPalette: () => void;
  hideCommandPalette: () => void;
  importFromMarkdown: (content: string, options?: Record<string, unknown>) => void;
  importFromHTML: (content: string, options?: Record<string, unknown>) => void;
  exportToMarkdown: () => string;
  exportToHTML: () => string;
  registerCommand: (command: Record<string, unknown>) => void;
  unregisterCommand: (commandId: string) => void;
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
  isHTMLEmbedSelected?: boolean;
  isHTMLPreviewMode?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export interface CoreToolbarClassNames {
  toolbar?: string;
  section?: string;
}