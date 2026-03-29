/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

export {
  createEditorSystem,
  BaseProvider,
  useBaseEditor,
} from "./createEditorSystem";
export { createExtension } from "./createExtension";
export type {
  EditorConfig,
  EditorContextType,
  Extension,
  ExtensionCategory,
} from "@lyfie/luthor-headless/extensions/types";
export {
  defaultLuthorTheme,
  mergeThemes,
  isLuthorTheme,
  createEditorThemeStyleVars,
  LUTHOR_EDITOR_THEME_TOKENS,
} from "./theme";
export type { LuthorTheme, LuthorEditorThemeToken, LuthorEditorThemeOverrides } from "./theme";
export { clearLexicalSelection, resolveLinkNodeKeyFromAnchor } from "./lexical-interop";
export type { LexicalEditor } from "lexical";
export {
  markdownToJSON,
  jsonToMarkdown,
  type JsonDocument,
  type MarkdownBridgeFlavor,
  type SourceMetadataMode,
  type MarkdownBridgeOptions,
} from "./markdown";
export {
  htmlToJSON,
  jsonToHTML,
  type HtmlBridgeOptions,
} from "./html";
export {
  MARKDOWN_SUPPORTED_NODE_TYPES,
  HTML_SUPPORTED_NODE_TYPES,
  MARKDOWN_NATIVE_KEY_MAP,
  HTML_NATIVE_KEY_MAP,
  MARKDOWN_TEXT_NATIVE_FORMAT_MASK,
  isDefaultBridgeValue,
  isMarkdownRepresentable,
  isHTMLRepresentable,
  extractMarkdownMetadataPatch,
  extractHTMLMetadataPatch,
} from "./source-capability";
export {
  appendMetadataEnvelopes,
  extractMetadataEnvelopes,
  prepareDocumentForBridge,
  rehydrateDocumentFromEnvelopes,
  type BridgeMode,
  type MetadataEnvelope,
  type ExtractedMetadataEnvelopes,
  type PreparedBridgeDocument,
} from "./metadata-envelope";

