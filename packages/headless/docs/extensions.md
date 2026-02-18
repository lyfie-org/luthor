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
import { boldExtension } from "@lyfie/luthor-headless";

const extensions = [boldExtension] as const;

// Usage
commands.toggleBold(); // Toggle bold formatting
activeStates.bold; // Check if current selection is bold
```

### Italic Extension

```tsx
import { italicExtension } from "@lyfie/luthor-headless";

const extensions = [italicExtension] as const;

commands.toggleItalic();
activeStates.italic;
```

### Underline Extension

```tsx
import { underlineExtension } from "@lyfie/luthor-headless";

const extensions = [underlineExtension] as const;

commands.toggleUnderline();
activeStates.underline;
```

### Strikethrough Extension

```tsx
import { strikethroughExtension } from "@lyfie/luthor-headless";

const extensions = [strikethroughExtension] as const;

commands.toggleStrikethrough();
activeStates.strikethrough;
```

### Code Extension

```tsx
import { codeExtension } from "@lyfie/luthor-headless";

const extensions = [codeExtension] as const;

commands.formatText("code"); // Inline code
activeStates.code;
```

### Font Family Extension

```tsx
import { fontFamilyExtension } from "@lyfie/luthor-headless";

const configuredFontFamilyExtension = fontFamilyExtension.configure({
  options: [
    { value: "default", label: "Default", fontFamily: "inherit" },
    {
      value: "inter",
      label: "Inter",
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      cssImportUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    },
  ],
  cssLoadStrategy: "on-demand", // or "none" | "preload-all"
});

const extensions = [configuredFontFamilyExtension] as const;

commands.setFontFamily("inter");
commands.clearFontFamily();

const current = await commands.getCurrentFontFamily();
const options = commands.getFontFamilyOptions();
activeStates.hasCustomFontFamily;
```

`setFontFamily` only accepts configured `options`, so the font list stays controlled.

### Font Size Extension

```tsx
import { fontSizeExtension } from "@lyfie/luthor-headless";

const extensions = [fontSizeExtension] as const;

commands.setFontSize("16");
commands.clearFontSize();

const current = await commands.getCurrentFontSize();
const options = commands.getFontSizeOptions();
activeStates.hasCustomFontSize;
```

`setFontSize` accepts only configured values from `options`.

### Line Height Extension

```tsx
import { lineHeightExtension } from "@lyfie/luthor-headless";

const extensions = [lineHeightExtension] as const;

commands.setLineHeight("1.5");
commands.clearLineHeight();

const current = await commands.getCurrentLineHeight();
const options = commands.getLineHeightOptions();
activeStates.hasCustomLineHeight;
```

### Text Color Extension

```tsx
import { textColorExtension } from "@lyfie/luthor-headless";

const extensions = [textColorExtension] as const;

commands.setTextColor("red");
commands.clearTextColor();

const current = await commands.getCurrentTextColor();
const options = commands.getTextColorOptions();
activeStates.hasCustomTextColor;
```

### Text Highlight Extension

```tsx
import { textHighlightExtension } from "@lyfie/luthor-headless";

const extensions = [textHighlightExtension] as const;

commands.setTextHighlight("yellow");
commands.clearTextHighlight();

const current = await commands.getCurrentTextHighlight();
const options = commands.getTextHighlightOptions();
activeStates.hasTextHighlight;
```

### Subscript Extension

```tsx
import { subscriptExtension } from "@lyfie/luthor-headless";

const extensions = [subscriptExtension] as const;

commands.toggleSubscript();
activeStates.subscript;
```

### Superscript Extension

```tsx
import { superscriptExtension } from "@lyfie/luthor-headless";

const extensions = [superscriptExtension] as const;

commands.toggleSuperscript();
activeStates.superscript;
```

### Link Extension

```tsx
import { linkExtension } from "@lyfie/luthor-headless";

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
import { listExtension } from "@lyfie/luthor-headless";

const extensions = [listExtension] as const;

commands.toggleUnorderedList(); // • Bullet list
commands.toggleOrderedList(); // 1. Numbered list
commands.toggleCheckList(); // ☑ Checklist

activeStates.unorderedList;
activeStates.orderedList;
activeStates.checkList;
```

### Block Format Extension

```tsx
import { blockFormatExtension } from "@lyfie/luthor-headless";

const extensions = [blockFormatExtension] as const;

commands.toggleHeading("h1"); // H1 heading
commands.toggleHeading("h2"); // H2 heading
commands.toggleQuote(); // Blockquote
commands.setTextAlignment("left"); // Align left
commands.setTextAlignment("center"); // Align center
commands.setTextAlignment("right"); // Align right
commands.setTextAlignment("justify"); // Justify

activeStates.isH1;
activeStates.isH2;
activeStates.isQuote;
activeStates.isTextAlignedLeft;
activeStates.isTextAlignedCenter;
activeStates.isTextAlignedRight;
activeStates.isTextAlignedJustify;
```

### Code Block Extension

```tsx
import { codeFormatExtension } from "@lyfie/luthor-headless";

const extensions = [codeFormatExtension] as const;

commands.toggleCodeBlock();

activeStates.isInCodeBlock;
```

### Horizontal Rule Extension

```tsx
import { horizontalRuleExtension } from "@lyfie/luthor-headless";

const extensions = [horizontalRuleExtension] as const;

commands.insertHorizontalRule();
```

Markdown shortcuts for horizontal rules are supported when markdown shortcuts are enabled in your stack.
Supported shortcut inputs: `---`, `___`.

### Table Extension

```tsx
import { tableExtension } from "@lyfie/luthor-headless";

const extensions = [tableExtension] as const;

commands.insertTable({ rows: 3, columns: 3, includeHeaders: false });

commands.insertRowAbove();
commands.insertRowBelow();
commands.insertColumnLeft();
commands.insertColumnRight();

commands.toggleRowHeader();
commands.toggleColumnHeader();

commands.mergeSelectedCells();
commands.unmergeSelectedCell();

commands.deleteRow();
commands.deleteColumn();
commands.deleteTable();

activeStates.isTableSelected;
activeStates.isInTableCell;
```

`toggleRowHeader` and `toggleColumnHeader` update headers after insertion, so table headers are not limited to initial `includeHeaders` setup.

## Media Extensions

### Image Extension

```tsx
import { imageExtension } from "@lyfie/luthor-headless";

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
import { htmlEmbedExtension } from "@lyfie/luthor-headless";

const extensions = [htmlEmbedExtension] as const;

commands.insertHTMLEmbed();
commands.toggleHTMLPreview();

activeStates.isHTMLEmbedSelected;
activeStates.isHTMLPreviewMode;
```

## History Extension

### Undo/Redo

```tsx
import { historyExtension } from "@lyfie/luthor-headless";

const extensions = [historyExtension] as const;

commands.undo();
commands.redo();

activeStates.canUndo;
activeStates.canRedo;
```

## Export/Import Extensions

### HTML Extension

```tsx
import { htmlExtension } from "@lyfie/luthor-headless";

const extensions = [htmlExtension] as const;

const html = await commands.exportToHTML();
await commands.importFromHTML(htmlString);
```

### Markdown Extension

```tsx
import { markdownExtension } from "@lyfie/luthor-headless";

const extensions = [markdownExtension] as const;

const markdown = await commands.exportToMarkdown();
await commands.importFromMarkdown(markdownString);
```

## Creating Custom Extensions

```tsx
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";

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
} from "@lyfie/luthor-headless";

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

