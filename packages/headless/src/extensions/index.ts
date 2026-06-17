/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/**
 * Luthor editor extensions
 *
 * Exports all available extensions for the Luthor editor system.
 * Extensions provide functionality like text formatting, media insertion,
 * export/import capabilities, and more.
 *
 * @packageDocumentation
 */

// Text formatting extensions
export { BoldExtension, boldExtension } from "./formatting/BoldExtension";
export { ItalicExtension, italicExtension } from "./formatting/ItalicExtension";
export {
  UnderlineExtension,
  underlineExtension,
} from "./formatting/UnderlineExtension";
export {
  StrikethroughExtension,
  strikethroughExtension,
} from "./formatting/StrikethroughExtension";
export { LinkExtension, linkExtension } from "./formatting/LinkExtension";
export {
  HorizontalRuleExtension,
  horizontalRuleExtension,
} from "./formatting/HorizontalRuleExtension";
export {
  FontFamilyExtension,
  fontFamilyExtension,
  type FontFamilyConfig,
  type FontFamilyOption,
  type FontCssLoadStrategy,
} from "./formatting/FontFamilyExtension";
export {
  FontSizeExtension,
  fontSizeExtension,
  type FontSizeConfig,
  type FontSizeOption,
} from "./formatting/FontSizeExtension";
export {
  LineHeightExtension,
  lineHeightExtension,
  type LineHeightConfig,
  type LineHeightOption,
} from "./formatting/LineHeightExtension";
export {
  TextColorExtension,
  textColorExtension,
  type TextColorConfig,
  type TextColorOption,
} from "./formatting/TextColorExtension";
export {
  TextHighlightExtension,
  textHighlightExtension,
  type TextHighlightConfig,
  type TextHighlightOption,
} from "./formatting/TextHighlightExtension";
export {
  SubscriptExtension,
  subscriptExtension,
} from "./formatting/SubscriptExtension";
export {
  SuperscriptExtension,
  superscriptExtension,
} from "./formatting/SuperscriptExtension";
export {
  TableExtension,
  tableExtension,
  type TableConfig,
} from "./formatting/TableExtension";

// Structure extensions
export { ListExtension, listExtension } from "./formatting/ListExtension";
export {
  CodeExtension,
  codeExtension,
  type CodeExtensionConfig,
} from "./formatting/CodeExtension";
export {
  type CodeHighlightProvider,
  type CodeHighlightProviderConfig,
} from "./formatting/codeHighlightProvider";
export {
  CodeIntelligenceExtension,
  codeIntelligenceExtension,
  type CodeIntelligenceConfig,
  type CodeIntelligenceCommands,
  type CodeLanguageOptionsMode,
  type CodeLanguageOptionsConfig,
} from "./formatting/CodeIntelligenceExtension";
export {
  CodeFormatExtension,
  codeFormatExtension,
} from "./formatting/CodeFormatExtension";
export {
  BlockFormatExtension,
  blockFormatExtension,
} from "./formatting/BlockFormatExtension";

// History and undo/redo
export { HistoryExtension, historyExtension } from "./core/HistoryExtension";

// Draggable extensions
export {
  DraggableBlockExtension,
  draggableBlockExtension,
  type DraggableConfig,
} from "./core/DraggableBlockExtension";

// Media extensions
export { ImageExtension, imageExtension } from "./media/ImageExtension";
export {
  IframeEmbedExtension,
  iframeEmbedExtension,
} from "./media/IframeEmbedExtension";
export {
  YouTubeEmbedExtension,
  youTubeEmbedExtension,
} from "./media/YouTubeEmbedExtension";

// Custom extensions
export { createCustomNodeExtension } from "./custom/CustomNodeExtension";

// Embed extensions (reusable wikilink / file-embed / transclusion / block-anchor
// nodes, host resolver seam, typeahead trigger, and drop/paste upload pipeline)
export {
  EmbedResolverContext,
  EmbedResolverProvider,
  useEmbedResolvers,
  type EmbedResolvers,
  type SavedCardMetadata,
  WikilinkNode,
  WikilinkExtension,
  wikilinkExtension,
  $createWikilinkNode,
  $isWikilinkNode,
  WIKILINK_MARKDOWN_TRANSFORMER,
  type SerializedWikilinkNode,
  FileEmbedNode,
  FileEmbedExtension,
  fileEmbedExtension,
  $createFileEmbedNode,
  $isFileEmbedNode,
  FILE_EMBED_MARKDOWN_TRANSFORMER,
  type SerializedFileEmbedNode,
  TransclusionNode,
  TransclusionExtension,
  transclusionExtension,
  $createTransclusionNode,
  $isTransclusionNode,
  TRANSCLUSION_MARKDOWN_TRANSFORMER,
  type SerializedTransclusionNode,
  BlockAnchorNode,
  BlockAnchorExtension,
  blockAnchorExtension,
  $createBlockAnchorNode,
  $isBlockAnchorNode,
  BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
  type SerializedBlockAnchorNode,
  SavedCardNode,
  SavedCardExtension,
  savedCardExtension,
  $createSavedCardNode,
  $isSavedCardNode,
  SAVED_CARD_MARKDOWN_TRANSFORMER,
  type SerializedSavedCardNode,
  CalloutNode,
  CalloutExtension,
  calloutExtension,
  $createCalloutNode,
  $isCalloutNode,
  CALLOUT_MARKDOWN_TRANSFORMER,
  type SerializedCalloutNode,
  WikilinkTypeaheadExtension,
  wikilinkTypeaheadExtension,
  type WikilinkTypeaheadMenuState,
  type WikilinkTypeaheadConfig,
  type WikilinkTypeaheadCommands,
  type WikilinkTypeaheadStateQueries,
  FileDropUploadExtension,
  fileDropUploadExtension,
  type FileDropUploadConfig,
} from "./embeds";

// Core extensions
export {
  richTextExtension,
  RichText,
  type RichTextConfig,
  type RichTextComponentProps,
} from "./core/RichTextExtension";
export {
  TabIndentExtension,
  tabIndentExtension,
} from "./core/TabIndentExtension";
export {
  EmojiExtension,
  emojiExtension,
  LIGHTWEIGHT_EMOJI_CATALOG,
  type EmojiCatalogAdapter,
  type EmojiCatalogItem,
  type EmojiSuggestionState,
  type EmojiConfig,
  type EmojiCommands,
  type EmojiStateQueries,
} from "./core/EmojiExtension";
export * from "./core";

// Base classes and types
export { TextFormatExtension } from "./base/TextFormatExtension";
export * from "./types";

// Export media types
export * from "./media/types";
export * from "./base/BaseExtension";
