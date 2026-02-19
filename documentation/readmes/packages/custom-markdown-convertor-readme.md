# Custom Markdown Convertor for Luthor

## Overview

The **Enhanced Markdown Convertor** is a custom solution built into the Luthor headless package that preserves all extension data (embeds, images, alignment, sizing) when exporting visual content to Markdown and reimporting it.

This solves a critical problem:
- **Standard Markdown** is feature-stripped and doesn't support rich embeds
- **HTML** preserves everything but is not human-readable
- **JSONB** is exact but not web-friendly
- **Enhanced Markdown** combines the best: readable markdown + embedded metadata

## Architecture

### Approach

The convertor uses **HTML comments** to embed JSON metadata in markdown:

```markdown
<!-- LUTHOR_BLOCK {"type":"youtube-embed","payload":{"src":"...","width":560,...}} -->
**[YouTube Embed: https://youtube.com/watch?v=...]**
```

Why HTML comments?
1. ✅ Transparent in most markdown viewers (comments are hidden)
2. ✅ Survives markdown-to-markdown transfers
3. ✅ Humans can read the fallback text if needed
4. ✅ Easy to parse and extract
5. ✅ Compliant with markdown spec

### Three-Tier Storage Strategy

For maximum flexibility, store three formats in parallel:

```typescript
{
  content: {
    jsonb: "{ ... }",           // Exact node reconstruction
    markdown: "# Content\n...", // Human-readable with metadata
    html: "<h1>Content</h1>..." // Legacy/web export
  }
}
```

| Use Case | Format |
|----------|--------|
| **Exact restore** | JSONB (primary) |
| **Human reading** | Markdown |
| **Web export** | HTML |
| **All metadata** | Markdown |

## Implementation

### Location

- **Core Logic**: `packages/headless/src/utils/EnhancedMarkdownConvertor.ts`
- **Documentation**: `packages/headless/docs/enhanced-markdown.md`
- **Exports**: Available from `@lyfie/luthor-headless`

### Key Functions

```typescript
import { 
  EnhancedMarkdownConvertor,
  type BlockMetadata 
} from '@lyfie/luthor-headless';

// Export visual → markdown with metadata
const enhancedMarkdown = EnhancedMarkdownConvertor.lexicalNodesToEnhancedMarkdown(
  editor.getEditorState().toJSON().root.children
);

// Parse markdown and extract metadata
const { cleanedMarkdown, metadata } = 
  EnhancedMarkdownConvertor.parseEnhancedMarkdown(enhancedMarkdown);

// Extract just metadata
const blocks: BlockMetadata[] = 
  EnhancedMarkdownConvertor.extractMetadataFromEnhancedMarkdown(markdown);
```

## Usage Examples

### 1. Export with Metadata Preservation

```typescript
// Get markdown with embedded metadata
const markdown = editorRef.current.getMarkdown();

// Store in database
await db.updateContent({
  id: documentId,
  content: {
    jsonb: editorRef.current.getJSONB(),
    markdown: markdown, // Contains metadata comments
    html: editorRef.current.getHTML()
  }
});
```

### 2. Import with Full Fidelity

```typescript
// When reimporting, use markdown with embedded metadata
const { metadata } = EnhancedMarkdownConvertor.parseEnhancedMarkdown(
  document.content.markdown
);

// Import standard markdown (metadata will be in comments)
editorRef.current.injectMarkdown(document.content.markdown);

// Optional: use metadata for analytics or validation
metadata.forEach(block => {
  console.log(`Found ${block.type}: ${block.payload.src}`);
});
```

### 3. Manual Metadata Extraction (Advanced)

```typescript
const markdown = `
# My Document

<!-- LUTHOR_BLOCK {"type":"youtube-embed","payload":{"src":"https://youtube.com/watch?v=..."}} -->
**[YouTube Embed...]**

Regular paragraph.
`;

const { cleanedMarkdown, metadata } = 
  EnhancedMarkdownConvertor.parseEnhancedMarkdown(markdown);

// cleanedMarkdown = "# My Document\n\n**[YouTube Embed...]**\n\nRegular paragraph."
// metadata = [{ type: 'youtube-embed', payload: {...} }]

// Now reconstruct embed nodes programmatically if needed
metadata.forEach(block => {
  if (block.type === 'youtube-embed') {
    editor.execCommand(insertYouTubeEmbed, {
      url: block.payload.src,
      width: block.payload.width,
      height: block.payload.height,
      alignment: block.payload.alignment
    });
  }
});
```

## Format Specification

### Metadata Comment Structure

```html
<!-- LUTHOR_BLOCK <JSON> -->
```

Where `<JSON>` is:

```typescript
{
  "type": "youtube-embed" | "iframe-embed" | "image",
  "payload": { /* node-specific properties */ }
}
```

### Node Types

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
    "src": "https://example.com",
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
    "alt": "Description",
    "caption": "Optional caption",
    "alignment": "center",
    "width": 800,
    "height": 600
  }
}
```

## Benefits

### ✅ Lossless Round-Trip
Visual → Markdown → Visual preserves 100% of data

### ✅ Human-Readable
Regular markdown tools can view and edit (metadata in comments)

### ✅ Web-Friendly
Comments are transparent in web contexts (Slack, Discord, etc.)

### ✅ Database-Friendly
Store alongside JSONB for audit trails and versioning

### ✅ Graceful Degradation
If metadata is stripped, embeds render with defaults

### ✅ Easy Integration
Works with standard markdown export/import flows

## Comparison Matrix

|  | Standard MD | Enhanced MD | HTML | JSONB |
|---|---|---|---|---|
| Human-readable | ✅ | ✅ | ❌ | ❌ |
| Preserves width | ❌ | ✅ | ✅ | ✅ |
| Preserves height | ❌ | ✅ | ✅ | ✅ |
| Preserves alignment | ❌ | ✅ | ✅ | ✅ |
| Preserves embed type | ❌ | ✅ | ✅ | ✅ |
| Web-friendly | ✅ | ✅ | ✅ | ❌ |
| Exact reconstruction | ❌ | ✅ | ~ | ✅ |
| View in raw text | ✅ | ✅ | ❌ | ❌ |

## Future Enhancements

1. **Transformer Integration**: Full Lexical transformer registration for automatic metadata handling during standard markdown import/export
2. **Custom Block Types**: Extend to feature cards, callouts, code blocks with metadata
3. **Bulk Operations**: Batch metadata extraction for analytics and reporting
4. **Schema Mapping**: Map metadata to custom database schema fields (`block-type`, `timestamp`, etc.)
5. **Streaming**: Support for large documents with streaming import/export
6. **Versioning**: Track metadata versions and migrations
7. **Compression**: Optional gzip compression for large payloads

## Testing

The Enhanced Markdown Convertor is tested through:

1. **Unit Tests**: Metadata serialization/deserialization
2. **Integration Tests**: Round-trip conversion (Lexical → MD → Lexical)
3. **Demo App**: Live showcase with multiple embeds and content types

To test locally:

```typescript
// In the demo app
const editorRef = useRef();
const md = editorRef.current.getMarkdown();
console.log(md); // See embedded metadata comments

// Extract and inspect metadata
const { metadata } = EnhancedMarkdownConvertor.parseEnhancedMarkdown(md);
console.log(metadata); // All embed data preserved
```

## Troubleshooting

### Metadata Comments Are Visible

**Issue**: HTML comments showing in editor

**Solution**: This is by design—they're metadata, not content. Markdown viewers hide comments. If visible in a CMS, configure the editor to filter `<!--` patterns in visual mode.

### Metadata Lost After Markdown Edit

**Issue**: User edits markdown, metadata comments disappear

**Solution**: This is expected. When users manually edit markdown, metadata may be lost. Provide a warning before allowing raw markdown editing, or reconstruct from JSONB if available.

### Embeds Don't Reconstruct

**Issue**: Imported markdown has metadata but embeds don't render

**Solution**: Ensure your import handler calls the appropriate `insertYouTubeEmbed`, `insertIframeEmbed`, or `insertImage` commands based on `block.type`.

## Contributing

To add support for new node types:

1. Add type to `BlockMetadata['type']` union
2. Add payload interface to convertor
3. Add `walkNodes` case for the new type
4. Update documentation
5. Test round-trip conversion

---

**Package**: `@lyfie/luthor-headless`  
**Version**: 2.2.0+  
**Status**: Stable  
**Last Updated**: 2026-02-19
