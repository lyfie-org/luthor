# Luthor Presets

**Batteries-included presets and plug-and-play configurations for the Luthor editor**

This package provides ready-to-use editor presets built on top of [@lyfie/luthor-headless](../headless/README.md). All Lexical dependencies are included - no additional installations required.

[![npm version](https://badge.fury.io/js/%40lyfie%2Fluthor.svg)](https://badge.fury.io/js/%40lyfie%2Fluthor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## Why Use This Package?

### ✅ Zero Configuration Hassle
- All Lexical packages bundled as dependencies
- No peer dependency warnings
- No version conflicts to resolve

### 🎮 Ready-to-Use Editors
- Multiple presets for different use cases
- Pre-built toolbar components
- Styled and themed out of the box

### 🔧 Still Fully Customizable
- Extend or modify any preset
- Access all luthor-headless features
- Build on top of presets with your own extensions

---

## Installation

Install both the headless package and this preset package:

```bash
npm install @lyfie/luthor-headless
npm install @lyfie/luthor
```

**That's it!** All required Lexical packages are automatically installed as dependencies of `@lyfie/luthor`.

### What Gets Installed

When you install `@lyfie/luthor`, npm automatically installs:
- `@lyfie/luthor-headless` (the core editor)
- `lexical` (the Lexical framework)
- All `@lexical/*` packages (code, html, link, list, markdown, react, rich-text, selection, table, utils)

These satisfy the peer dependencies of luthor-headless, so you don't need to install anything else.

### Peer Dependencies

Only React remains as a peer dependency (which you already have in your project):
- `react` (^18.0.0 or ^19.0.0)
- `react-dom` (^18.0.0 or ^19.0.0)

---

## Quick Start

### Using the Extensive Editor (Recommended)

The fastest way to get a full-featured editor:

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import type { ExtensiveEditorRef } from "@lyfie/luthor";
import { useRef } from "react";

function App() {
  const editorRef = useRef<ExtensiveEditorRef>(null);

  const handleSave = () => {
    const html = editorRef.current?.getHTML();
    const markdown = editorRef.current?.getMarkdown();
    console.log({ html, markdown });
  };

  return (
    <div>
      <ExtensiveEditor
        ref={editorRef}
        placeholder="Start writing..."
        onReady={(methods) => {
          console.log("Editor ready!", methods);
        }}
      />
      <button onClick={handleSave}>Save Content</button>
    </div>
  );
}
```

This gives you:
- ✅ Full-featured toolbar
- ✅ All formatting options (bold, italic, underline, etc.)
- ✅ Lists, tables, images, links
- ✅ Code blocks with syntax highlighting
- ✅ HTML/Markdown export
- ✅ Dark mode support
- ✅ Command palette (Cmd+K / Ctrl+K)

### Using Preset Definitions

For more control over the editor setup:

```tsx
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";
import { extensiveExtensions } from "@lyfie/luthor";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

function MyToolbar() {
  const { commands, activeStates } = useEditor();
  
  return (
    <div className="my-custom-toolbar">
      <button onClick={() => commands.toggleBold()}>
        Bold
      </button>
      {/* Add your custom UI */}
    </div>
  );
}

function App() {
  return (
    <Provider extensions={extensiveExtensions}>
      <MyToolbar />
      <RichText placeholder="Start writing..." />
    </Provider>
  );
}
```

---

## Available Presets

All presets are exported with their configurations and can be used as starting points:

### 1. **Minimal** - `minimalPreset`
Lightweight editor for short text and basic formatting.
- Bold, italic, link
- Perfect for comments or short descriptions

### 2. **Classic** - `classicPreset`
Traditional rich text editor feel.
- Standard formatting toolbar
- Good for general content editing

### 3. **Blog** - `blogPreset`
Optimized for blog post writing.
- Headings, images, quotes
- Clean reading experience

### 4. **CMS** - `cmsPreset`
Content management system focused.
- Advanced formatting options
- Image handling with alignment
- Tables for structured content

### 5. **Docs** - `docsPreset`
Documentation and technical writing.
- Code blocks with syntax highlighting
- Tables and lists
- Markdown export

### 6. **Chat** - `chatPreset`
Lightweight for messaging interfaces.
- Minimal formatting
- Emoji and mentions (with custom extensions)

### 7. **Email** - `emailPreset`
Email composition focused.
- Safe HTML output
- Link handling
- Simple formatting

### 8. **Markdown** - `markdownPreset`
Markdown-first editing.
- Markdown shortcuts
- Preview mode
- Clean export

### 9. **Code** - `codePreset`
Code snippet editor.
- Syntax highlighting
- Multiple language support
- Line numbers

### 10. **Default** - `defaultPreset`
Balanced general-purpose editor.
- Good starting point for customization

### 11. **Extensive** - `extensivePreset` + `ExtensiveEditor`
Full-featured editor with everything.
- All extensions included
- Complete toolbar
- Pre-built component

---

## Usage Examples

### Example 1: Using Preset Registry

```tsx
import { presetRegistry } from "@lyfie/luthor";

// Get a preset by ID
const blogPreset = presetRegistry.blog;
const minimalPreset = presetRegistry.minimal;

console.log(blogPreset.label); // "Blog"
console.log(blogPreset.toolbar); // ["heading", "bold", "italic", ...]
```

### Example 2: Customizing a Preset

```tsx
import { defaultPreset } from "@lyfie/luthor";
import { createEditorSystem } from "@lyfie/luthor-headless";

// Clone and customize
const myPreset = {
  ...defaultPreset,
  id: "my-custom",
  label: "My Custom Editor",
  toolbar: ["bold", "italic", "link"], // Override toolbar
  config: {
    ...defaultPreset.config,
    placeholder: "Write your story...",
  },
};
```

### Example 3: Building with Extensions

```tsx
import { extensiveExtensions } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

function Editor() {
  const { commands } = useEditor();
  
  return (
    <div>
      <button onClick={() => commands.toggleBold()}>Bold</button>
      <button onClick={() => commands.insertTable({ rows: 3, cols: 3 })}>
        Insert Table
      </button>
      <RichText />
    </div>
  );
}

function App() {
  return (
    <Provider extensions={extensiveExtensions}>
      <Editor />
    </Provider>
  );
}
```

### Example 4: Export/Import Content

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import type { ExtensiveEditorRef } from "@lyfie/luthor";
import { useRef, useState } from "react";

function App() {
  const editorRef = useRef<ExtensiveEditorRef>(null);
  const [savedContent, setSavedContent] = useState("");

  const handleExport = () => {
    const html = editorRef.current?.getHTML();
    const markdown = editorRef.current?.getMarkdown();
    setSavedContent(html || "");
    console.log({ html, markdown });
  };

  const handleImport = () => {
    editorRef.current?.injectHTML(savedContent);
    // or
    editorRef.current?.injectMarkdown("# Hello\n\nMarkdown content");
  };

  return (
    <div>
      <ExtensiveEditor ref={editorRef} />
      <button onClick={handleExport}>Export</button>
      <button onClick={handleImport}>Import</button>
    </div>
  );
}
```

---

## API Reference

### ExtensiveEditor Component

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import type { ExtensiveEditorRef, ExtensiveEditorProps } from "@lyfie/luthor";
```

**Props:**
```typescript
interface ExtensiveEditorProps {
  placeholder?: string;           // Placeholder text
  className?: string;             // CSS class for container
  onReady?: (ref: ExtensiveEditorRef) => void;  // Called when editor is ready
}
```

**Ref Methods:**
```typescript
interface ExtensiveEditorRef {
  injectMarkdown: (content: string) => void;  // Import markdown
  injectHTML: (content: string) => void;      // Import HTML
  getMarkdown: () => string;                  // Export as markdown
  getHTML: () => string;                      // Export as HTML
}
```

### Preset Registry

```tsx
import { presetRegistry } from "@lyfie/luthor";
import type { EditorPreset } from "@lyfie/luthor";
```

**Type:**
```typescript
interface EditorPreset {
  id: string;                           // Unique preset ID
  label: string;                        // Display name
  description?: string;                 // Preset description
  extensions?: Extension[];             // Included extensions
  config?: EditorConfig;                // Editor configuration
  theme?: LuthorTheme;                 // Custom theme
  toolbar?: string[];                   // Toolbar items
  components?: Record<string, unknown>; // Custom components
  css?: string;                         // CSS file path
}
```

**Available Presets:**
- `presetRegistry.minimal`
- `presetRegistry.classic`
- `presetRegistry.blog`
- `presetRegistry.cms`
- `presetRegistry.docs`
- `presetRegistry.chat`
- `presetRegistry.email`
- `presetRegistry.markdown`
- `presetRegistry.code`
- `presetRegistry.default`
- `presetRegistry.extensive`

### Extension Sets

```tsx
import { extensiveExtensions } from "@lyfie/luthor";
```

Pre-configured extension arrays that can be used with luthor-headless:

```typescript
const extensions = extensiveExtensions as const;
const { Provider } = createEditorSystem<typeof extensions>();
```

---

## Comparison: Headless vs Luthor

| Feature | @lyfie/luthor-headless | @lyfie/luthor |
|---------|----------------------|---------------|
| **Installation** | Manual Lexical deps | Zero additional deps |
| **Bundle Size** | Minimal | Includes all Lexical |
| **Setup Time** | More configuration | Instant |
| **Flexibility** | Maximum control | Pre-configured |
| **Use Case** | Custom editors | Quick implementation |
| **UI Components** | Build your own | ExtensiveEditor included |
| **Presets** | None | 11 ready-to-use |
| **Dependencies** | Peer deps | Bundled deps |

**Choose luthor-headless when:**
- Building completely custom UI
- Need minimal bundle size
- Want control over Lexical versions
- Have specific dependency requirements

**Choose @lyfie/luthor when:**
- Want to start quickly
- Need a working editor ASAP
- Don't want to manage dependencies
- Want ready-to-use components

[📖 Learn more about luthor-headless](../headless/README.md)

---

## Advanced Usage

### Creating Custom Presets

```tsx
import type { EditorPreset } from "@lyfie/luthor";
import { 
  boldExtension, 
  italicExtension, 
  linkExtension 
} from "@lyfie/luthor-headless";

const myCustomPreset: EditorPreset = {
  id: "my-custom",
  label: "My Custom Editor",
  description: "A tailored editor for my use case",
  extensions: [boldExtension, italicExtension, linkExtension],
  config: {
    placeholder: "Start typing...",
    editable: true,
  },
  toolbar: ["bold", "italic", "link"],
};
```

### Extending Existing Presets

```tsx
import { defaultPreset } from "@lyfie/luthor";
import { myCustomExtension } from "./my-extension";

const enhancedPreset: EditorPreset = {
  ...defaultPreset,
  id: "enhanced-default",
  extensions: [
    ...(defaultPreset.extensions || []),
    myCustomExtension,
  ],
  toolbar: [
    ...(defaultPreset.toolbar || []),
    "myCustomCommand",
  ],
};
```

### Accessing Luthor-Headless Features

Since `@lyfie/luthor` depends on `@lyfie/luthor-headless`, you have access to all headless features:

```tsx
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";
import { extensiveExtensions } from "@lyfie/luthor";

const { Provider, useEditor } = createEditorSystem<typeof extensiveExtensions>();

// Use all luthor-headless APIs
function MyEditor() {
  const { commands, activeStates, lexical } = useEditor();
  
  // Access Lexical editor instance
  lexical?.update(() => {
    // Direct Lexical operations
  });
  
  return <RichText />;
}
```

---

## TypeScript Support

Fully typed with TypeScript. All exports include type definitions:

```typescript
import type {
  EditorPreset,
  ExtensiveEditorRef,
  ExtensiveEditorProps,
  ExtensiveEditorMode,
} from "@lyfie/luthor";
```

---

## Styling

The `ExtensiveEditor` component includes default styles. To customize:

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";

// Add custom class
<ExtensiveEditor className="my-editor" />
```

```css
/* Override default styles */
.my-editor {
  --luthor-bg: #ffffff;
  --luthor-text: #000000;
  --luthor-border: #e5e5e5;
}

/* Dark mode */
.my-editor.dark {
  --luthor-bg: #1a1a1a;
  --luthor-text: #ffffff;
  --luthor-border: #333333;
}
```

---

## Migration from Headless

If you're using luthor-headless and want to switch:

**Before:**
```bash
npm install @lyfie/luthor-headless
npm install lexical @lexical/react @lexical/html # ... many packages
```

**After:**
```bash
npm install @lyfie/luthor-headless
npm install @lyfie/luthor
# Remove individual @lexical/* packages if desired
```

Your code doesn't need to change! All luthor-headless APIs work the same way.

---

## Examples

Check out the [demo site](https://luthor.lyfie.app/demo) for live examples of all presets.

---

**Built with ❤️ by the Luthor Team**

MIT License - Use it however you want.
