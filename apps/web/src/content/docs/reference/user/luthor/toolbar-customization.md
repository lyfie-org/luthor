---
title: "Toolbar Layout Customization"
---

# Toolbar Layout Customization

The `@lyfie/luthor` package provides a flexible toolbar layout system that allows you to customize the grouping and ordering of toolbar buttons to match your preferred editing interface.

## Default Layouts

[Luthor](/demo/) ships with two predefined toolbar layouts:

### Traditional Layout (Default)

The `TRADITIONAL_TOOLBAR_LAYOUT` groups toolbar items in a familiar pattern similar to word processors like Microsoft Word or Google Docs:

1. **Typography Controls** - Font family, font size, line height
2. **Text Formatting** - Bold, italic, underline, strikethrough, text color, text highlight
3. **Enhanced Formatting** - Subscript, superscript, inline code, link
4. **Paragraph & Alignment** - Block format (headings/paragraph), quote, text alignment (left, center, right, justify)
5. **Lists** - Bullet list, numbered list, checklist, indent, outdent
6. **Insert Elements** - Table, image, emoji, embeds, horizontal rule
7. **Code Blocks** - Code block toggle
8. **History** - Undo, redo
9. **Utilities** - Command palette, theme toggle

### Legacy Layout

The `DEFAULT_TOOLBAR_LAYOUT` maintains the original grouping pattern for backward compatibility.

## Using a Layout

### With ExtensiveEditor

Pass the `toolbarLayout` prop to customize the toolbar:

```tsx
import { ExtensiveEditor, TRADITIONAL_TOOLBAR_LAYOUT } from "@lyfie/luthor";

function MyEditor() {
  return (
    <ExtensiveEditor
      placeholder="Start writing..."
      toolbarLayout={TRADITIONAL_TOOLBAR_LAYOUT}
    />
  );
}
```

The `ExtensiveEditor` uses `TRADITIONAL_TOOLBAR_LAYOUT` by default, so you only need to specify it if you want to override with a custom layout.

### With Core Toolbar Component

If you're building a custom preset, you can pass the layout directly to the `Toolbar` component:

```tsx
import { Toolbar, TRADITIONAL_TOOLBAR_LAYOUT } from "@lyfie/luthor/core";

function MyCustomEditor() {
  return (
    <Toolbar
      commands={commands}
      hasExtension={hasExtension}
      activeStates={activeStates}
      isDark={isDark}
      toggleTheme={toggleTheme}
      onCommandPaletteOpen={handleCommandPaletteOpen}
      layout={TRADITIONAL_TOOLBAR_LAYOUT}
    />
  );
}
```

## Creating a Custom Layout

You can create your own toolbar layout by defining a `ToolbarLayout` object:

```tsx
import type { ToolbarLayout } from "@lyfie/luthor";

const myCustomLayout: ToolbarLayout = {
  sections: [
    {
      // Group basic formatting together
      items: ["bold", "italic", "underline", "strikethrough"],
    },
    {
      // Typography controls
      items: ["fontFamily", "fontSize", "textColor"],
    },
    {
      // Block-level formatting
      items: ["blockFormat", "alignLeft", "alignCenter", "alignRight"],
    },
    {
      // Lists
      items: ["unorderedList", "orderedList", "indentList", "outdentList"],
    },
    {
      // Insert tools
      items: ["link", "image", "table", "horizontalRule"],
    },
    {
      // Utilities
      items: ["undo", "redo", "commandPalette", "themeToggle"],
    },
  ],
};
```

Then use it in your editor:

```tsx
<ExtensiveEditor toolbarLayout={myCustomLayout} />
```

## Available Toolbar Items

Here's the complete list of toolbar items you can include in your custom layout:

### Typography
- `fontFamily` - Font family selector
- `fontSize` - Font size selector
- `lineHeight` - Line height selector
- `textColor` - Text color picker
- `textHighlight` - Text background highlight color picker

### Basic Formatting
- `bold` - Bold text
- `italic` - Italic text
- `underline` - Underline text
- `strikethrough` - Strikethrough text

### Enhanced Formatting
- `subscript` - Subscript text
- `superscript` - Superscript text
- `code` - Inline code
- `link` - Insert/remove link

### Block Format
- `blockFormat` - Block type selector (paragraph, headings)
- `quote` - Blockquote toggle
- `alignLeft` - Align text left
- `alignCenter` - Align text center
- `alignRight` - Align text right
- `alignJustify` - Justify text
- `codeBlock` - Code block toggle

### Lists
- `unorderedList` - Bullet list
- `orderedList` - Numbered list
- `checkList` - Checklist
- `indentList` - Indent list item
- `outdentList` - Outdent list item

### Insert Elements
- `horizontalRule` - Insert horizontal rule
- `table` - Insert table
- `image` - Insert image (with URL/file upload options)
- `emoji` - Insert emoji
- `embed` - Insert embed (iframe/YouTube)

### History
- `undo` - Undo last action
- `redo` - Redo last undone action

### Utilities
- `commandPalette` - Open command palette
- `themeToggle` - Toggle light/dark theme

## Notes

- Items are automatically hidden if their corresponding extension is not loaded
- Empty sections (sections with no visible items) are not rendered
- The toolbar respects extension availability, so missing extensions won't show buttons
- Each section is visually separated with appropriate spacing

## Example: Minimal Layout

Here's a minimal layout for a simple editor:

```tsx
const minimalLayout: ToolbarLayout = {
  sections: [
    {
      items: ["bold", "italic", "link"],
    },
    {
      items: ["unorderedList", "orderedList"],
    },
    {
      items: ["undo", "redo"],
    },
  ],
};
```

## Example: Writer-Focused Layout

A layout optimized for long-form writing:

```tsx
const writerLayout: ToolbarLayout = {
  sections: [
    {
      items: ["fontSize", "fontFamily"],
    },
    {
      items: ["bold", "italic", "underline"],
    },
    {
      items: ["blockFormat", "quote"],
    },
    {
      items: ["alignLeft", "alignCenter", "alignJustify"],
    },
    {
      items: ["link", "image", "horizontalRule"],
    },
    {
      items: ["undo", "redo", "commandPalette"],
    },
  ],
};
```
