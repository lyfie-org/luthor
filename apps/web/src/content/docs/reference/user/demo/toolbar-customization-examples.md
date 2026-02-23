---
title: "Toolbar Layout Customization Examples for Demo App"
---

# Toolbar Layout Customization Examples for Demo App

This document shows how to customize the toolbar layout in the demo app (apps/demo).

## Default Behavior

Without any customization, the `ExtensiveEditor` uses the `TRADITIONAL_TOOLBAR_LAYOUT` automatically:

```tsx
// apps/demo/src/pages/HomePage.tsx or App.tsx
import { ExtensiveEditor } from "@lyfie/luthor";

function MyEditorPage() {
  return (
    <ExtensiveEditor
      placeholder="Start writing..."
      // No toolbarLayout prop needed - uses TRADITIONAL_TOOLBAR_LAYOUT by default
    />
  );
}
```

## Explicit Layout Selection

You can explicitly specify which predefined layout to use:

```tsx
import { ExtensiveEditor, TRADITIONAL_TOOLBAR_LAYOUT, DEFAULT_TOOLBAR_LAYOUT } from "@lyfie/luthor";

function MyEditorPage() {
  return (
    <ExtensiveEditor
      placeholder="Start writing..."
      toolbarLayout={TRADITIONAL_TOOLBAR_LAYOUT} // Traditional word processor style (default)
      // OR
      // toolbarLayout={DEFAULT_TOOLBAR_LAYOUT} // Legacy/original layout
    />
  );
}
```

## Custom Layout Example 1: Minimal Writer Layout

For a distraction-free writing experience:

```tsx
import { ExtensiveEditor, type ToolbarLayout } from "@lyfie/luthor";

const writerLayout: ToolbarLayout = {
  sections: [
    // Essential formatting only
    { items: ["bold", "italic", "link"] },
    // Headings and structure
    { items: ["blockFormat", "quote"] },
    // Lists
    { items: ["unorderedList", "orderedList"] },
    // Utilities
    { items: ["undo", "redo", "commandPalette"] },
  ],
};

function WriterEditor() {
  return (
    <ExtensiveEditor
      placeholder="Begin your story..."
      toolbarLayout={writerLayout}
    />
  );
}
```

## Custom Layout Example 2: Developer-Friendly Layout

Emphasizing code and technical writing features:

```tsx
import { ExtensiveEditor, type ToolbarLayout } from "@lyfie/luthor";

const developerLayout: ToolbarLayout = {
  sections: [
    // Text formatting
    { items: ["bold", "italic", "strikethrough", "code"] },
    // Block types
    { items: ["blockFormat", "quote", "codeBlock"] },
    // Lists and structure
    { items: ["unorderedList", "orderedList", "checkList", "indentList", "outdentList"] },
    // Insert elements
    { items: ["link", "image", "table", "horizontalRule"] },
    // Utilities
    { items: ["undo", "redo", "commandPalette", "themeToggle"] },
  ],
};

function DeveloperEditor() {
  return (
    <ExtensiveEditor
      placeholder="Document your code..."
      toolbarLayout={developerLayout}
      initialTheme="dark" // Developers love dark mode
    />
  );
}
```

## Custom Layout Example 3: Rich Content Creator Layout

For bloggers and content creators who need all the formatting tools:

```tsx
import { ExtensiveEditor, type ToolbarLayout } from "@lyfie/luthor";

const contentCreatorLayout: ToolbarLayout = {
  sections: [
    // Typography controls
    { items: ["fontFamily", "fontSize", "lineHeight"] },
    // Formatting with colors
    { items: ["bold", "italic", "underline", "strikethrough", "textColor", "textHighlight"] },
    // Advanced formatting
    { items: ["subscript", "superscript", "code", "link"] },
    // Block formatting and alignment
    { items: ["blockFormat", "quote", "alignLeft", "alignCenter", "alignRight", "alignJustify"] },
    // Lists
    { items: ["unorderedList", "orderedList", "checkList", "indentList", "outdentList"] },
    // Rich media
    { items: ["image", "table", "emoji"] },
    // Embeds and dividers
    { items: ["embed", "horizontalRule"] },
    // Code blocks
    { items: ["codeBlock"] },
    // History and utilities
    { items: ["undo", "redo"] },
    { items: ["commandPalette", "themeToggle"] },
  ],
};

function ContentCreatorEditor() {
  return (
    <ExtensiveEditor
      placeholder="Create amazing content..."
      toolbarLayout={contentCreatorLayout}
    />
  );
}
```

## Custom Layout Example 4: JSONB-First Compact Layout

Minimal toolbar for teams that persist JSONB and prefer compact editing controls:

```tsx
import { ExtensiveEditor, type ToolbarLayout } from "@lyfie/luthor";

const compactJsonbLayout: ToolbarLayout = {
  sections: [
    // Keep only essential editing controls
    { items: ["bold", "italic", "code", "link"] },
    { items: ["unorderedList", "orderedList"] },
    { items: ["commandPalette", "themeToggle"] },
  ],
};

function CompactJsonbEditor() {
  return (
    <ExtensiveEditor
      placeholder="Start writing with compact controls..."
      toolbarLayout={compactJsonbLayout}
      initialMode="visual"
      availableModes={["visual", "jsonb"]}
    />
  );
}
```

## Dynamic Layout Based on Context

You can even change the toolbar layout based on user preferences or application state:

```tsx
import { ExtensiveEditor, TRADITIONAL_TOOLBAR_LAYOUT, type ToolbarLayout } from "@lyfie/luthor";
import { useState } from "react";

const simpleLayout: ToolbarLayout = {
  sections: [
    { items: ["bold", "italic", "link"] },
    { items: ["unorderedList", "orderedList"] },
    { items: ["undo", "redo"] },
  ],
};

function AdaptiveEditor() {
  const [advancedMode, setAdvancedMode] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          <input
            type="checkbox"
            checked={advancedMode}
            onChange={(e) => setAdvancedMode(e.target.checked)}
          />
          Advanced toolbar
        </label>
      </div>
      
      <ExtensiveEditor
        placeholder="Start writing..."
        toolbarLayout={advancedMode ? TRADITIONAL_TOOLBAR_LAYOUT : simpleLayout}
      />
    </div>
  );
}
```

## Testing Your Custom Layout

1. Install dependencies: `pnpm install`
2. Build the luthor package: `pnpm --filter @lyfie/luthor build`
3. Start the demo app: `pnpm --filter demo dev`
4. Open your browser to see the changes

## All Available Toolbar Items

Reference for creating custom layouts:

- **Typography**: `fontFamily`, `fontSize`, `lineHeight`, `textColor`, `textHighlight`
- **Basic Formatting**: `bold`, `italic`, `underline`, `strikethrough`
- **Enhanced Formatting**: `subscript`, `superscript`, `code`, `link`
- **Block Format**: `blockFormat`, `quote`, `alignLeft`, `alignCenter`, `alignRight`, `alignJustify`, `codeBlock`
- **Lists**: `unorderedList`, `orderedList`, `checkList`, `indentList`, `outdentList`
- **Insert**: `horizontalRule`, `table`, `image`, `emoji`, `embed`
- **History**: `undo`, `redo`
- **Utilities**: `commandPalette`, `themeToggle`

Items automatically hide if their corresponding extension is not available.
