# Enhanced Markdown Format

## Overview

The Enhanced Markdown Format preserves all Luthor extension data (embeds, images, alignment, sizing) while keeping markdown human-readable. It uses HTML comments to embed metadata that the editor can reconstruct.

## Format Specification

### Core Principle

Regular markdown content (paragraphs, headings, lists, etc.) is plain text. Extension nodes (YouTube embeds, iframes, images with metadata) are wrapped with metadata comments:

```
<!-- LUTHOR_BLOCK {"type":"youtube-embed","payload":{...}} -->
**[YouTube Embed: https://youtube.com/watch?v=...]**
```

### Metadata Comment Structure

```
<!-- LUTHOR_BLOCK <JSON> -->
```

Where `<JSON>` contains:

```typescript
{
  "type": "youtube-embed" | "iframe-embed" | "image",
  "payload": {
    // Node-specific properties
  }
}
```

### Node Types and Payloads

#### YouTube Embed

```json
{
  "type": "youtube-embed",
  "payload": {
    "src": "https://youtube.com/watch?v=...",
    "width": 560,
    "height": 315,
    "alignment": "center",
    "start": 120
  }
}
```

#### Iframe Embed

```json
{
  "type": "iframe-embed",
  "payload": {
    "src": "https://example.com/embed",
    "width": 600,
    "height": 400,
    "alignment": "left",
    "title": "Embedded Page"
  }
}
```

#### Image

```json
{
  "type": "image",
  "payload": {
    "src": "https://example.com/image.jpg",
    "alt": "Image description",
    "caption": "Optional caption text",
    "alignment": "center",
    "width": 800,
    "height": 600
  }
}
```

## Example

A document with mixed content might look like:

```markdown
# Document Title

## Introduction

This is a regular paragraph with **bold** and *italic* text.

<!-- LUTHOR_BLOCK {"type":"youtube-embed","payload":{"src":"https://youtube.com/watch?v=dQw4w9WgXcQ","width":560,"height":315,"alignment":"center"}} -->
**[YouTube Embed: https://youtube.com/watch?v=dQw4w9WgXcQ]**

## Content

Here's an image with metadata:

<!-- LUTHOR_BLOCK {"type":"image","payload":{"src":"https://example.com/photo.jpg","alt":"Beautiful landscape","caption":"Mountain scenery","alignment":"left","width":400,"height":300}} -->
![Beautiful landscape](https://example.com/photo.jpg)
*Mountain scenery*

Regular markdown continues here...
```

## Usage

### Export with Metadata

```typescript
import { ExtensiveEditor } from '@lyfie/luthor';

const editorRef = useRef();

// Get markdown with embedded metadata
const enhancedMarkdown = editorRef.current.getMarkdown();

// Store in database alongside JSONB
database.save({
  content: {
    jsonb: editorRef.current.getJSONB(),
    markdown: enhancedMarkdown
  }
});
```

### Import with Metadata

```typescript
// Editor automatically handles metadata during import
editorRef.current.injectMarkdown(enhancedMarkdown);

// All extension properties (width, height, alignment, etc.) are restored
```

### Manual Metadata Extraction

```typescript
import { 
  EnhancedMarkdownConvertor, 
  ENHANCED_MARKDOWN_TRANSFORMERS 
} from '@lyfie/luthor-headless';

const { cleanedMarkdown, metadata } = 
  EnhancedMarkdownConvertor.parseEnhancedMarkdown(markdown);

metadata.forEach(block => {
  console.log(block.type);     // 'youtube-embed', 'iframe-embed', or 'image'
  console.log(block.payload);  // Full node properties
});
```

## Benefits

1. **Lossless Round-trip**: Visual → Markdown → Visual preserves all data
2. **Human-Readable**: Plain markdown tools can still view the content
3. **Graceful Degradation**: If metadata is stripped, embeds render with sensible defaults
4. **Database-Friendly**: Store alongside JSONB for audit trails and fallback
5. **Easy Integration**: Use as standard markdown export, comments are transparent

## Comparison

| Feature | Standard Markdown | Enhanced Markdown | HTML | JSONB |
|---------|-------------------|-------------------|------|-------|
| Human-readable | ✓ | ✓ | ✗ | ✗ |
| Preserves width/height | ✗ | ✓ | ✓ | ✓ |
| Preserves alignment | ✗ | ✓ | ✓ | ✓ |
| Preserves embed type | ✗ | ✓ | ✓ | ✓ |
| Preserves captions | ✗ | ✓ | ✓ | ✓ |
| Web editor friendly | ✓ | ✓ | ✓ | ✗ |
| Exact node reconstruction | ✗ | ✓ | ~ | ✓ |

## Limitations

- Metadata comments add ~200-500 bytes per embed
- Some markdown parsers may not preserve comments (usually OK, just loses metadata)
- Complex nested structures may need custom handling

## Future Enhancements

- Support for custom block types (feature cards, callouts, etc.)
- Bulk metadata extraction for analytics
- Markdown-to-database schema mapping (e.g., `luthor-block-type`, `timestamp` fields)
- Streaming import for large documents
