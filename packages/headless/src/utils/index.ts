/**
 * Enhanced Markdown Export/Import Utilities
 * 
 * This module provides tools for preserving all Luthor extension data
 * when exporting to and importing from Markdown format.
 * 
 * Use this when you need:
 * - Lossless Markdown round-trip (visual → markdown → visual)
 * - Human-readable markdown with embedded metadata
 * - Graceful fallback if metadata is stripped
 * - Integration with database JSONB storage alongside markdown
 * 
 * Example:
 *   import { 
 *     EnhancedMarkdownConvertor, 
 *     ENHANCED_MARKDOWN_TRANSFORMERS 
 *   } from '@lyfie/luthor-headless/utils';
 * 
 *   // Programmatic conversion (recommended for now)
 *   const editorState = editor.getEditorState().toJSON();
 *   const enhancedMarkdown = EnhancedMarkdownConvertor.lexicalNodesToEnhancedMarkdown(
 *     editorState.root.children
 *   );
 * 
 *   // Parse markdown with metadata extraction
 *   const { cleanedMarkdown, metadata } = 
 *     EnhancedMarkdownConvertor.parseEnhancedMarkdown(enhancedMarkdown);
 *   
 *   // Reconstructs youtube embeds, iframes, images with all properties
 *   await editor.importFromMarkdown(cleanedMarkdown);
 *   metadata.forEach(block => {
 *     // Re-inject extension nodes as needed based on block.type
 *   });
 */

export {
  serializeBlockMetadata,
  parseBlockMetadata,
  lexicalNodesToEnhancedMarkdown,
  parseEnhancedMarkdown,
  extractMetadataFromEnhancedMarkdown,
  enhancedMarkdownToLexicalJSON,
  type BlockMetadata,
} from './EnhancedMarkdownConvertor';

export {
  createExtensionTransformer,
  ENHANCED_MARKDOWN_TRANSFORMERS,
} from './EnhancedMarkdownTransformers';

// Convenience namespace for clarity
export const EnhancedMarkdownConvertor = {
  serializeBlockMetadata: require('./EnhancedMarkdownConvertor').serializeBlockMetadata,
  parseBlockMetadata: require('./EnhancedMarkdownConvertor').parseBlockMetadata,
  lexicalNodesToEnhancedMarkdown: require('./EnhancedMarkdownConvertor').lexicalNodesToEnhancedMarkdown,
  parseEnhancedMarkdown: require('./EnhancedMarkdownConvertor').parseEnhancedMarkdown,
  extractMetadataFromEnhancedMarkdown: require('./EnhancedMarkdownConvertor').extractMetadataFromEnhancedMarkdown,
};
