# @lyfie/luthor-headless

Type-safe, headless rich text editor system for React, built on Lexical.

## Package scope

- Owns all Lexical-derived features and extension implementations.
- Exposes a typed extension composition system (`createEditorSystem`).
- Keeps runtime dependencies lightweight using peer dependencies for React/Lexical.
- Supports optional integrations (like `highlight.js`) without making them mandatory.

## Version and compatibility

- Package version: `2.2.0`
- React peers: `^18.0.0 || ^19.0.0`
- Lexical peers: `>=0.40.0` (`lexical` + required `@lexical/*` packages)
- Optional dependency: `highlight.js >=11.0.0`

## Why headless

Use this package when you want:

- full control over extension selection
- custom editor UI and layout
- typed command/state composition with minimal runtime surface

## Installation

```bash
pnpm add @lyfie/luthor-headless lexical @lexical/code @lexical/html @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

Optional:

```bash
pnpm add highlight.js
```

## Quick start

```tsx
import {
  createEditorSystem,
  RichText,
  richTextExtension,
  boldExtension,
  italicExtension,
} from "@lyfie/luthor-headless";

const extensions = [richTextExtension, boldExtension, italicExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands, activeStates } = useEditor();

  return (
    <div>
      <button onClick={() => commands.toggleBold()} aria-pressed={activeStates.bold}>
        Bold
      </button>
      <button onClick={() => commands.toggleItalic()} aria-pressed={activeStates.italic}>
        Italic
      </button>
    </div>
  );
}

export function Editor() {
  return (
    <Provider extensions={extensions} config={{ namespace: "LuthorEditor" }}>
      <Toolbar />
      <RichText placeholder="Write here..." />
    </Provider>
  );
}
```

## Extension model

- Extensions contribute commands, state queries, nodes, and plugins.
- Your extension list should be declared `as const` for full type inference.
- `useEditor()` returns only the command/state surface available from installed extensions.

## Core public building blocks

Frequently used APIs:

- `createEditorSystem`
- `RichText`
- extension factories such as `boldExtension`, `italicExtension`, `historyExtension`, `linkExtension`
- import/export helpers for HTML and enhanced markdown workflows

The exact exported surface is documented in:

- [../../documentation/developer/headless/source-file-reference.md](../../documentation/developer/headless/source-file-reference.md)

## Built-in extension categories

- Core UX: rich text, history, slash commands, floating toolbar, context menu, draggable blocks, tab indent, emoji
- Formatting: text styles, block formats, list/link/table/code/typography controls
- Media: image, iframe embeds, YouTube embeds
- Import/export: HTML and Markdown extensions
- Custom: factory for custom node-based extensions

## Import and export support

- Canonical fidelity: Lexical JSON
- Interop format: HTML
- Human-readable with metadata: enhanced Markdown (`LUTHOR_BLOCK` comment metadata)

## Installation notes

- Install required Lexical peer packages from the install command in this README.
- If using code intelligence/highlighting flows, install optional `highlight.js`.
- Ensure your app includes compatible React and React DOM versions.

## For contributors

- Keep headless package minimal and dependency-light.
- Implement Lexical-derived features in this package, then re-export/compose from `@lyfie/luthor`.
- Update docs whenever extension APIs or source file responsibilities change.

## Documentation

Canonical docs root: [../../documentation/index.md](../../documentation/index.md)

- User docs (headless): [../../documentation/user/headless/getting-started.md](../../documentation/user/headless/getting-started.md)
- Extension/config docs: [../../documentation/user/headless/extensions-and-configuration.md](../../documentation/user/headless/extensions-and-configuration.md)
- Import/export docs: [../../documentation/user/headless/import-export.md](../../documentation/user/headless/import-export.md)
- Developer architecture: [../../documentation/developer/headless/architecture.md](../../documentation/developer/headless/architecture.md)
- Developer file map: [../../documentation/developer/headless/source-file-reference.md](../../documentation/developer/headless/source-file-reference.md)
- Maintainer notes: [../../documentation/developer/headless/maintainer-notes.md](../../documentation/developer/headless/maintainer-notes.md)

Related luthor preset docs:

- [../../packages/luthor/README.md](../../packages/luthor/README.md)
- [../../documentation/user/luthor/getting-started.md](../../documentation/user/luthor/getting-started.md)

Related demo docs:

- [../../documentation/user/demo/getting-started.md](../../documentation/user/demo/getting-started.md)
- [../../documentation/developer/demo/architecture.md](../../documentation/developer/demo/architecture.md)

## Workspace development

From repository root:

```bash
pnpm --filter @lyfie/luthor-headless dev
pnpm --filter @lyfie/luthor-headless build
pnpm --filter @lyfie/luthor-headless lint
```
