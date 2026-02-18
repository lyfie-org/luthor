# @lyfie/luthor-headless

Type-safe, headless rich text editor system for React, built on Lexical.

## Installation

```bash
# npm
npm install @lyfie/luthor-headless

# pnpm
pnpm add @lyfie/luthor-headless
```

Install peer dependencies:

```bash
# npm
npm install lexical @lexical/code @lexical/html @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom

# pnpm
pnpm add lexical @lexical/code @lexical/html @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

## Quick Start

```tsx
import {
  createEditorSystem,
  RichText,
  boldExtension,
  italicExtension,
} from "@lyfie/luthor-headless";

const extensions = [boldExtension, italicExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

function Toolbar() {
  const { commands, activeStates } = useEditor();
  return (
    <div>
      <button onClick={() => commands.toggleBold()} aria-pressed={activeStates.bold}>Bold</button>
      <button onClick={() => commands.toggleItalic()} aria-pressed={activeStates.italic}>Italic</button>
    </div>
  );
}

export function App() {
  return (
    <Provider extensions={extensions}>
      <Toolbar />
      <RichText placeholder="Write here..." />
    </Provider>
  );
}
```

## What This Package Exports

From `src/index.ts`:

- Core editor system APIs from `src/core`
- All built-in extensions and helpers from `src/extensions`

This includes formatting extensions, list/code/table/media support, export helpers, and editor primitives such as `createEditorSystem` and `RichText`.

## Prefer Presets?

If you want a faster plug-and-play setup with bundled Lexical dependencies and ready-made presets, use `@lyfie/luthor`:

- Preset package docs: [../luthor/README.md](../luthor/README.md)

## Package Links

- Headless deep docs: [docs/getting-started.md](docs/getting-started.md)
- Monorepo root docs: [../../README.md](../../README.md)
- Central docs index: [../../documentation/documentation-hub.md](../../documentation/documentation-hub.md)
- Developer README map: [../../documentation/developer_notes/readme-map.md](../../documentation/developer_notes/readme-map.md)

## Development (Workspace)

From repo root:

```bash
pnpm dev --filter @lyfie/luthor-headless
pnpm build --filter @lyfie/luthor-headless
pnpm lint --filter @lyfie/luthor-headless
```
