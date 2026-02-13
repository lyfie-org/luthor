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
  TableExtension,
  tableExtension,
  type TableConfig,
} from "./formatting/TableExtension";

// Structure extensions
export { ListExtension, listExtension } from "./formatting/ListExtension";
export { CodeExtension, codeExtension } from "./formatting/CodeExtension";
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

// Export/import extensions
export { HTMLExtension, htmlExtension } from "./export/HTMLExtension";
export {
  MarkdownExtension,
  markdownExtension,
} from "./export/MarkdownExtension";

// Media extensions
export { ImageExtension, imageExtension } from "./media/ImageExtension";
export {
  HTMLEmbedExtension,
  htmlEmbedExtension,
} from "./media/HTMLEmbedExtension";

// Custom extensions
export { createCustomNodeExtension } from "./custom/CustomNodeExtension";

// Core extensions
export {
  richTextExtension,
  RichText,
  type RichTextConfig,
  type RichTextComponentProps,
} from "./core/RichTextExtension";
export * from "./core";

// Base classes and types
export { TextFormatExtension } from "./base/TextFormatExtension";
export * from "./types";

// Export transformers
export { ALL_MARKDOWN_TRANSFORMERS } from "./export/transformers";

// Export media types
export * from "./media/types";
export * from "./base/BaseExtension";
