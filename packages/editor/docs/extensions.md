# Luthor Extensions Guide

## Overview

Extensions are the building blocks of Luthor. Each extension provides specific functionality like text formatting, media insertion, or export capabilities. Extensions are designed to be modular and composable.

## Core Concept

```tsx
// Extensions are configured once and reused
const extensions = [
  boldExtension,
  italicExtension,
  listExtension,
  imageExtension,
] as const; // Required for type safety

// The system automatically provides typed commands and state
const { commands, activeStates } = useEditor();
// commands.toggleBold() ✅
// activeStates.bold ✅
```

## Text Formatting Extensions

### Bold Extension

```tsx
import { boldExtension } from "@lyfie/luthor";

const extensions = [boldExtension] as const;

// Usage
commands.toggleBold(); // Toggle bold formatting
activeStates.bold; // Check if current selection is bold
```

### Italic Extension

```tsx
import { italicExtension } from "@lyfie/luthor";

const extensions = [italicExtension] as const;

commands.toggleItalic();
activeStates.italic;
```

### Underline Extension

```tsx
import { underlineExtension } from "@lyfie/luthor";

const extensions = [underlineExtension] as const;

commands.toggleUnderline();
activeStates.underline;
```

### Strikethrough Extension

```tsx
import { strikethroughExtension } from "@lyfie/luthor";

const extensions = [strikethroughExtension] as const;

commands.toggleStrikethrough();
activeStates.strikethrough;
```

### Code Extension

```tsx
import { codeExtension } from "@lyfie/luthor";

const extensions = [codeExtension] as const;

commands.formatText("code"); // Inline code
activeStates.code;
```

### Link Extension

```tsx
import { linkExtension } from "@lyfie/luthor";

const extensions = [linkExtension] as const;

// Configure paste listener and validation
linkExtension.configure({
  pasteListener: {
    insert: true, // Auto-convert pasted URLs to links
    autoLink: false, // Auto-link URLs as you type
  },
  validateUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  defaultAttributes: {
    target: "_blank",
    rel: "noopener noreferrer",
  },
});

// Usage
commands.insertLink("https://example.com", "Link Text");
commands.insertLink(); // Prompts for URL
commands.removeLink();

activeStates.isLink;
```

## Structure Extensions

### List Extension

```tsx
import { listExtension } from "@lyfie/luthor";

const extensions = [listExtension] as const;

commands.toggleUnorderedList(); // • Bullet list
commands.toggleOrderedList(); // 1. Numbered list

activeStates.unorderedList;
activeStates.orderedList;
```

### Block Format Extension

```tsx
import { blockFormatExtension } from "@lyfie/luthor";

const extensions = [blockFormatExtension] as const;

commands.toggleHeading("h1"); // H1 heading
commands.toggleHeading("h2"); // H2 heading
commands.toggleQuote(); // Blockquote

activeStates.isH1;
activeStates.isH2;
activeStates.isQuote;
```

### Code Block Extension

```tsx
import { codeFormatExtension } from "@lyfie/luthor";

const extensions = [codeFormatExtension] as const;

commands.toggleCodeBlock();

activeStates.isInCodeBlock;
```

## Media Extensions

### Image Extension

```tsx
import { imageExtension } from "@lyfie/luthor";

const extensions = [imageExtension] as const;

// Configure upload handler
imageExtension.configure({
  uploadHandler: async (file) => {
    // Your upload logic here
    return imageUrl;
  },
  defaultAlignment: "center",
  resizable: true,
  pasteListener: { insert: true, replace: true },
});

// Usage
commands.insertImage({
  src: "image-url",
  alt: "Alt text",
  caption: "Optional caption",
});

commands.setImageAlignment("center");
commands.setImageCaption("New caption");

activeStates.imageSelected;
```

### HTML Embed Extension

```tsx
import { htmlEmbedExtension } from "@lyfie/luthor";

const extensions = [htmlEmbedExtension] as const;

commands.insertHTMLEmbed();
commands.toggleHTMLPreview();

activeStates.isHTMLEmbedSelected;
activeStates.isHTMLPreviewMode;
```

## History Extension

### Undo/Redo

```tsx
import { historyExtension } from "@lyfie/luthor";

const extensions = [historyExtension] as const;

commands.undo();
commands.redo();

activeStates.canUndo;
activeStates.canRedo;
```

## Export/Import Extensions

### HTML Extension

```tsx
import { htmlExtension } from "@lyfie/luthor";

const extensions = [htmlExtension] as const;

const html = await commands.exportToHTML();
await commands.importFromHTML(htmlString);
```

### Markdown Extension

```tsx
import { markdownExtension } from "@lyfie/luthor";

const extensions = [markdownExtension] as const;

const markdown = await commands.exportToMarkdown();
await commands.importFromMarkdown(markdownString);
```

## Creating Custom Extensions

```tsx
import { BaseExtension } from "@lyfie/luthor/extensions/base";

class MyCustomExtension extends BaseExtension<"myCustom"> {
  constructor() {
    super("myCustom");
  }

  getCommands(editor) {
    return {
      insertMyBlock: (data) => {
        // Implementation
      },
    };
  }

  getStateQueries(editor) {
    return {
      hasMyBlock: () => Promise.resolve(false),
    };
  }

  getNodes() {
    return [MyCustomNode];
  }
}

const myExtension = new MyCustomExtension();
```

## Extension Dependencies

Some extensions depend on others:

- `codeFormatExtension` requires `codeExtension`
- `htmlExtension` and `markdownExtension` work independently
- `historyExtension` is standalone

## Best Practices

1. **Use `as const`** - Required for type safety
2. **Configure before use** - Set up extensions before creating the provider
3. **Check availability** - Use `hasExtension()` to conditionally render UI
4. **Handle errors** - Always include error boundaries
5. **Type safety** - Let TypeScript guide your usage

## Complete Example

```tsx
import {
  boldExtension,
  italicExtension,
  listExtension,
  imageExtension,
  htmlExtension,
  historyExtension,
} from "@lyfie/luthor";

const extensions = [
  boldExtension,
  italicExtension,
  listExtension,
  imageExtension,
  htmlExtension,
  historyExtension,
] as const;

// Configure image extension
imageExtension.configure({
  uploadHandler: async (file) => {
    // Upload logic
    return url;
  },
});

const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function MyEditor() {
  const { commands, activeStates, hasExtension } = useEditor();

  return (
    <div>
      {hasExtension("bold") && (
        <button onClick={() => commands.toggleBold()}>
          {activeStates.bold ? "Unbold" : "Bold"}
        </button>
      )}
      {/* More UI based on available extensions */}
    </div>
  );
}
```
