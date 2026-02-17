# Luthor-Headless

**Type-safe rich text editor for React developers**

Built on Meta's Lexical. Headless, extensible, and production-ready.

[![npm version](https://badge.fury.io/js/%40luthor%2Feditor.svg)](https://badge.fury.io/js/%40luthor%2Feditor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**[🚀 Demo](https://luthor.lyfie.app/demo)** • **[📖 Documentation](https://luthor.lyfie.app/docs)** • **[⚡ Playground](https://stackblitz.com/edit/vitejs-vite-bpg2kpze?file=src%2FEditor.tsx)**

![Luthor Editor](https://github.com/user-attachments/assets/ec547406-0ab0-4e69-b9d7-ccd050adf78a)

---

## Why Luthor?

Rich text editors shouldn't be a nightmare. Luthor makes building them delightful:

- **🔒 Type-safe everything** - Commands and states inferred from your extensions. No runtime surprises.
- **🎨 Headless & flexible** - Build any UI you want. Style it your way.
- **🧩 Modular extensions** - Add only what you need, when you need it.
- **⚡ Production features** - HTML/Markdown export, image handling, tables, undo/redo.
- **⚛️ React-first** - Hooks, components, and patterns you already know.

```tsx
// Your extensions define your API - TypeScript knows everything ✨
const extensions = [boldExtension, listExtension, imageExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function MyEditor() {
  const { commands, activeStates } = useEditor();

  // TypeScript autocompletes and validates these
  commands.toggleBold();        // ✅ Available
  commands.toggleUnorderedList(); // ✅ Available
  commands.insertImage();       // ✅ Available
  commands.nonExistent();       // ❌ TypeScript error
}
```

## Quick Start

### Installation

Luthor-Headless is designed to be lightweight with Lexical packages as **peer dependencies**.

```bash
npm install @lyfie/luthor-headless
```

Install the required Lexical peer dependencies:

```bash
npm install lexical @lexical/react @lexical/html @lexical/markdown @lexical/list @lexical/rich-text @lexical/selection @lexical/utils @lexical/code @lexical/link @lexical/table
```

> **💡 Want a simpler setup?** Check out [@lyfie/luthor](../luthor/README.md) which bundles all Lexical dependencies for you.

### Basic Usage

```bash
npm install @lyfie/luthor-headless
```

Install the Lexical peer dependencies:

```bash
npm install lexical @lexical/react @lexical/html @lexical/markdown @lexical/list @lexical/rich-text @lexical/selection @lexical/utils
```

```tsx
import {
  createEditorSystem,
  boldExtension,
  italicExtension,
  listExtension,
  RichText,
} from "@lyfie/luthor-headless";

const extensions = [boldExtension, italicExtension, listExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands, activeStates } = useEditor();
  return (
    <div className="toolbar">
      <button
        onClick={() => commands.toggleBold()}
        className={activeStates.bold ? "active" : ""}
      >
        Bold
      </button>
      <button
        onClick={() => commands.toggleItalic()}
        className={activeStates.italic ? "active" : ""}
      >
        Italic
      </button>
      <button onClick={() => commands.toggleUnorderedList()}>
        Bullet List
      </button>
    </div>
  );
}

function Editor() {
  return (
    <div className="editor-container">
      <Toolbar />
      <RichText placeholder="Start writing..." />
    </div>
  );
}

export default function App() {
  return (
    <Provider extensions={extensions}>
      <Editor />
    </Provider>
  );
}
```

**That's it.** You now have a fully functional, type-safe rich text editor.

## Installation Options

### Option 1: Headless Package (This Package)

For maximum control and flexibility:

```bash
# Install headless package
npm install @lyfie/luthor-headless

# Manually install Lexical peer dependencies
npm install lexical @lexical/react @lexical/html @lexical/markdown @lexical/list @lexical/rich-text @lexical/selection @lexical/utils @lexical/code @lexical/link @lexical/table
```

**Use this when:**
- You want complete control over Lexical versions
- Building a custom editor UI from scratch
- Need minimum bundle size
- Want to manage dependencies yourself

### Option 2: Full Package (Recommended for Quick Start)

For a batteries-included experience:

```bash
# Install both packages
npm install @lyfie/luthor-headless
npm install @lyfie/luthor

# That's it! All Lexical dependencies included
```

**Use this when:**
- You want ready-to-use editor presets
- Don't want to manage Lexical dependencies
- Need a working editor quickly
- Want plug-and-play components

[📖 See @lyfie/luthor documentation](../luthor/README.md)

## Features

### 🎨 Built-in Extensions (25+)
- **Text Formatting**: Bold, italic, underline, strikethrough, inline code
- **Structure**: Headings, lists (with nesting), quotes, horizontal rules
- **Rich Content**: Tables, images (upload/paste/alignment), links, code blocks
- **Advanced**: History (undo/redo), command palette, floating toolbar, context menus

### 🎯 Smart List Handling
- Toggle lists with intelligent nesting behavior
- Context-aware toolbar (indent/outdent appear when needed)
- Nested lists without keyboard shortcuts
- Clean UX that matches modern editors

### 📤 Export & Import
- **HTML** with semantic markup
- **Markdown** with GitHub Flavored syntax
- **JSON** for structured data
- Custom transformers for specialized formats

### 🎨 Theming & Styling
- CSS classes or Tailwind utilities
- Custom themes for consistent styling
- Dark mode support
- Accessible by default

## Real World Usage

Luthor powers editors in:
- Content management systems
- Documentation platforms
- Blog editors
- Note-taking applications
- Comment systems
- Collaborative writing tools

## Community & Support

- **[💬 Discord](https://discord.gg/RAMYSDRag7)** - Get help, share ideas
- **[🐛 GitHub Issues](https://github.com/lyfie-app/luthor/issues)** - Bug reports, feature requests
- **[💭 Discussions](https://github.com/lyfie-app/luthor/discussions)** - Questions, showcase your projects

## Contributing

We welcome contributions! Whether you:
- Find and report bugs
- Suggest new features
- Contribute code or documentation
- Share projects built with Luthor
- Star the repo to show support

Check our [Contributing Guide](./CONTRIBUTING.md) to get started.

## Support This Project

Luthor is free and open source, built by developers for developers. If it's helping you build better editors, consider supporting its development:

- **⭐ Star this repository** to show your support
- **💝 [Sponsor the project](https://github.com/sponsors/rahulnsanand)** to help with maintenance and new features
- **📢 Share Luthor** with other developers

Your support keeps this project alive and helps us build better tools for the React community.

---

**Built with ❤️ by [Rahul NS Anand](https://github.com/rahulnsanand)**

MIT License - Use it however you want.</content>

