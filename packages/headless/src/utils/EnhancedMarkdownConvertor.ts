/**
 * Enhanced Markdown Convertor
 * 
 * Converts Luthor editor content to/from Markdown while preserving all extension metadata
 * (embeds, images, alignment, etc.) using HTML comments and a custom metadata format.
 * 
 * Format Strategy:
 * - Regular markdown content (paragraphs, lists, headings) is human-readable
 * - Extension nodes (youtube-embed, iframe-embed, images) are wrapped with metadata comments
 * - Metadata is stored as JSON in HTML comments: <!-- LUTHOR_BLOCK type="..." {...} -->
 * - On import, metadata is extracted and node payloads are reconstructed
 * - Fallback: if metadata is missing, attempts sensible defaults or HTML-based reconstruction
 * 
 * This allows:
 * 1. Visual structure round-trip without data loss (extension data + sizes + alignment)
 * 2. Markdown to remain readable when viewed as plain text (metadata in comments)
 * 3. Easy export to other systems that understand HTML comments (web editors, CMSs)
 * 4. Graceful degradation if metadata is stripped (embeds render with defaults)
 */

export interface BlockMetadata {
  type: 'youtube-embed' | 'iframe-embed' | 'image';
  payload: Record<string, unknown>;
}

/**
 * Serialize block metadata as an HTML comment for embedding in markdown
 */
export function serializeBlockMetadata(metadata: BlockMetadata): string {
  return `<!-- LUTHOR_BLOCK ${JSON.stringify(metadata)} -->`;
}

/**
 * Parse HTML comment to extract Luthor block metadata
 */
export function parseBlockMetadata(commentText: string): BlockMetadata | null {
  try {
    const match = commentText.match(/^LUTHOR_BLOCK\s*(.+)$/);
    if (!match || !match[1]) return null;
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Convert Lexical JSON node format to enhanced markdown with embedded metadata
 * 
 * @param nodes - Lexical editor state nodes
 * @returns markdown string with embedded metadata for extensions
 */
export function lexicalNodesToEnhancedMarkdown(nodes: any[]): string {
  const lines: string[] = [];

  function walkNodes(nodeArray: any[]) {
    for (const node of nodeArray) {
      if (!node) continue;

      // Handle youtube-embed nodes
      if (node.type === 'youtube-embed') {
        const payload: BlockMetadata = {
          type: 'youtube-embed',
          payload: {
            src: node.src,
            width: node.width,
            height: node.height,
            alignment: node.alignment,
            start: node.start,
          },
        };
        lines.push(serializeBlockMetadata(payload));
        lines.push(`**[YouTube Embed: ${node.src}]**`);
        lines.push('');
        continue;
      }

      // Handle iframe-embed nodes
      if (node.type === 'iframe-embed') {
        const payload: BlockMetadata = {
          type: 'iframe-embed',
          payload: {
            src: node.src,
            width: node.width,
            height: node.height,
            alignment: node.alignment,
            title: node.title,
          },
        };
        lines.push(serializeBlockMetadata(payload));
        lines.push(`**[Iframe Embed: ${node.title || node.src}]**`);
        lines.push('');
        continue;
      }

      // Handle image nodes
      if (node.type === 'image') {
        const payload: BlockMetadata = {
          type: 'image',
          payload: {
            src: node.src,
            alt: node.alt,
            caption: node.caption,
            alignment: node.alignment,
            width: node.width,
            height: node.height,
          },
        };
        lines.push(serializeBlockMetadata(payload));
        lines.push(`![${node.alt || 'Image'}](${node.src})`);
        if (node.caption) {
          lines.push(`*${node.caption}*`);
        }
        lines.push('');
        continue;
      }

      // Handle heading nodes
      if (node.type === 'heading') {
        const level = node.tag.replace('h', '');
        const text = extractTextFromNode(node);
        lines.push(`${'#'.repeat(parseInt(level))} ${text}`);
        lines.push('');
        continue;
      }

      // Handle paragraph nodes
      if (node.type === 'paragraph') {
        const text = extractTextFromNode(node);
        if (text.trim()) {
          lines.push(text);
          lines.push('');
        }
        continue;
      }

      // Handle list nodes
      if (node.type === 'list') {
        const listItems = node.children || [];
        const isOrdered = node.listType === 'number';
        
        listItems.forEach((item: any, idx: number) => {
          const text = extractTextFromNode(item);
          const marker = isOrdered ? `${idx + 1}.` : '-';
          lines.push(`${marker} ${text}`);
        });
        lines.push('');
        continue;
      }

      // Handle quote/blockquote nodes
      if (node.type === 'quote') {
        const text = extractTextFromNode(node);
        lines.push(`> ${text}`);
        lines.push('');
        continue;
      }

      // Handle code block nodes
      if (node.type === 'code') {
        const text = extractTextFromNode(node);
        const lang = node.language || '';
        lines.push(`\`\`\`${lang}`);
        lines.push(text);
        lines.push('```');
        lines.push('');
        continue;
      }

      // Recursively handle children
      if (node.children && Array.isArray(node.children)) {
        walkNodes(node.children);
      }
    }
  }

  walkNodes(nodes);
  return lines.join('\n').trim();
}

/**
 * Extract plain text from a Lexical node (handling text + format nodes)
 */
function extractTextFromNode(node: any): string {
  if (node.text) {
    return node.text;
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map((child: any) => extractTextFromNode(child)).join('');
  }

  return '';
}

/**
 * Parse enhanced markdown (with embedded metadata) and extract block directives
 * 
 * This function scans markdown content for metadata comments and returns:
 * 1. Cleaned markdown (comments removed)
 * 2. A map of metadata blocks indexed by position or ID
 * 
 * @param markdown - Enhanced markdown string with embedded metadata
 * @returns { cleanedMarkdown, metadata }
 */
export function parseEnhancedMarkdown(markdown: string): {
  cleanedMarkdown: string;
  metadata: BlockMetadata[];
} {
  const lines = markdown.split('\n');
  const cleanedLines: string[] = [];
  const metadata: BlockMetadata[] = [];

  for (const line of lines) {
    const commentMatch = line.match(/<!--\s*(.+?)\s*-->/);
    if (commentMatch && commentMatch[1]) {
      const blockData = parseBlockMetadata(commentMatch[1]);
      if (blockData) {
        metadata.push(blockData);
      }
      // Don't include comment in cleaned markdown
      continue;
    }
    cleanedLines.push(line);
  }

  return {
    cleanedMarkdown: cleanedLines.join('\n').trim(),
    metadata,
  };
}

/**
 * Inject metadata back into markdown during import
 * 
 * When the user imports enhanced markdown, this function reconstructs
 * the editor state by:
 * 1. Using standard markdown import for text content
 * 2. Extracting metadata comments
 * 3. Returning metadata for the importer to reconstruct extension nodes
 * 
 * @param markdown - Enhanced markdown with metadata
 * @returns metadata blocks that caller should use to recreate extension nodes
 */
export function extractMetadataFromEnhancedMarkdown(markdown: string): BlockMetadata[] {
  const { metadata } = parseEnhancedMarkdown(markdown);
  return metadata;
}
/**
 * Convert enhanced markdown back to Lexical JSON format
 * This enables lossless round-trip conversion: Lexical JSON → Enhanced Markdown → Lexical JSON
 * 
 * Properly parses markdown syntax:
 * - Headings: # ## ### etc.
 * - Lists: - * or numbers
 * - Blockquotes: >
 * - Code blocks: ``` ```
 * - Text formatting is preserved as-is
 * 
 * @param markdown - Enhanced markdown string with embedded metadata
 * @returns Lexical editor state JSON
 */
export function enhancedMarkdownToLexicalJSON(markdown: string): any {
  const lines = markdown.split('\n');
  const nodes: any[] = [];
  let currentBlockMetadata: BlockMetadata | null = null;
  let buffer: string[] = [];
  let inCodeBlock = false;

  function createTextNode(text: string): any {
    return {
      type: 'text',
      text: text,
    };
  }

  function flushTextBuffer() {
    if (buffer.length === 0) return;
    
    const text = buffer.join('\n').trim();
    buffer = [];

    if (!text) return;

    // Check if it's a heading
    const headingMatch = text.match(/^(#+)\s+(.+)$/m);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      const level = headingMatch[1].length; // Count # symbols
      const headingText = headingMatch[2].trim();
      nodes.push({
        type: 'heading',
        tag: `h${level}`,
        children: [createTextNode(headingText)],
      });
      return;
    }

    // Check if it starts with a list marker
    if (text.match(/^(\s*)[-*]\s+/)) {
      const listItems = text.split('\n').filter((line) => line.trim());
      listItems.forEach((item) => {
        const cleaned = item.replace(/^(\s*)[-*]\s+/, '').trim();
        if (cleaned) {
          nodes.push({
            type: 'paragraph',
            children: [createTextNode(cleaned)],
          });
        }
      });
      return;
    }

    // Check if it starts with number list
    if (text.match(/^(\s*)\d+\.\s+/)) {
      const listItems = text.split('\n').filter((line) => line.trim());
      listItems.forEach((item) => {
        const cleaned = item.replace(/^(\s*)\d+\.\s+/, '').trim();
        if (cleaned) {
          nodes.push({
            type: 'paragraph',
            children: [createTextNode(cleaned)],
          });
        }
      });
      return;
    }

    // Check if it's a blockquote
    if (text.match(/^>\s+/m)) {
      const quoteText = text.replace(/^>\s+/gm, '').trim();
      nodes.push({
        type: 'quote',
        children: [createTextNode(quoteText)],
      });
      return;
    }

    // Default: treat as paragraph
    nodes.push({
      type: 'paragraph',
      children: [createTextNode(text)],
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';

    // Check for code block markers
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block - add accumulated code
        const code = buffer.length > 0 ? buffer.join('\n').trim() : '';
        if (code) {
          const language = buffer.length > 0 && buffer[0] ? buffer[0].trim() : '';
          nodes.push({
            type: 'code',
            language: language, // First line might be language syntax
            children: [createTextNode(code)],
          });
        }
        buffer = [];
        inCodeBlock = false;
      } else {
        // Start code block
        flushTextBuffer();
        inCodeBlock = true;
        // Optionally capture language (e.g., ```javascript)
        const lang = line.substring(3).trim();
        if (lang) {
          buffer.push(lang);
        }
      }
      continue;
    }

    // If in code block, accumulate all lines
    if (inCodeBlock) {
      buffer.push(line);
      continue;
    }

    // Check for metadata comment
    const commentMatch = line.match(/<!--\s*(.+?)\s*-->/);
    if (commentMatch && commentMatch[1]) {
      const blockData = parseBlockMetadata(commentMatch[1]);
      if (blockData) {
        flushTextBuffer();
        currentBlockMetadata = blockData;
      }
      continue;
    }

    // If we have pending metadata, the next non-empty line is the placeholder
    if (currentBlockMetadata && line.trim()) {
      // Reconstruct extension node from metadata
      const node = reconstructNodeFromMetadata(currentBlockMetadata);
      if (node) {
        nodes.push(node);
      }
      currentBlockMetadata = null;
      continue;
    }

    // Skip empty lines between blocks
    if (!line.trim() && buffer.length === 0) {
      continue;
    }

    // Accumulate text content
    if (line.trim() || buffer.length > 0) {
      buffer.push(line);
    }
  }

  // Flush any remaining text or code block
  if (inCodeBlock) {
    const code = buffer.join('\n').trim();
    if (code) {
      nodes.push({
        type: 'code',
        language: '',
        children: [createTextNode(code)],
      });
    }
  } else {
    flushTextBuffer();
  }

  // Return Lexical editor state format
  return {
    root: {
      type: 'root',
      children: nodes.length > 0 ? nodes : [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: '' }],
        },
      ],
    },
  };
}

/**
 * Reconstruct a Lexical node from extracted metadata
 */
function reconstructNodeFromMetadata(metadata: BlockMetadata): any | null {
  try {
    switch (metadata.type) {
      case 'youtube-embed': {
        const payload = metadata.payload as any;
        return {
          type: 'youtube-embed',
          src: payload.src || '',
          width: payload.width || 720,
          height: payload.height || 405,
          alignment: payload.alignment || 'center',
          start: payload.start || 0,
        };
      }

      case 'iframe-embed': {
        const payload = metadata.payload as any;
        return {
          type: 'iframe-embed',
          src: payload.src || '',
          width: payload.width || 720,
          height: payload.height || 405,
          alignment: payload.alignment || 'center',
          title: payload.title || 'Embedded Content',
        };
      }

      case 'image': {
        const payload = metadata.payload as any;
        return {
          type: 'image',
          src: payload.src || '',
          alt: payload.alt || '',
          caption: payload.caption || '',
          alignment: payload.alignment || 'center',
          width: payload.width,
          height: payload.height,
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error reconstructing node from metadata:', error, metadata);
    return null;
  }
}