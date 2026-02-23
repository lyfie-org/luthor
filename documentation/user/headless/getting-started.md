# @lyfie/luthor-headless: Getting Started (User)

## What this package is

`@lyfie/luthor-headless` is a type-safe, extension-driven rich text editor system built on Lexical and React. It gives you complete control over toolbar/UI while still exposing a structured command + state API.

## Versions and runtime requirements

- `@lyfie/luthor-headless`: `2.2.0`
- Node.js (workspace development): `>=20`
- React peer range: `^18.0.0 || ^19.0.0`
- Lexical peer range: `>=0.40.0` for `lexical` and required `@lexical/*` packages
- Optional package for code-language intelligence: `highlight.js >=11.0.0`

## Install

```bash
pnpm add @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

Optional:

```bash
pnpm add highlight.js
pnpm add @emoji-mart/data
```

Optional integration matrix:

- `highlight.js`: enables richer code token theming when your app loads a highlight stylesheet.
- `@emoji-mart/data`: enables larger emoji catalog auto-detection by `EmojiExtension`.
- If either package is missing, `@lyfie/luthor-headless` remains functional and falls back to built-in behavior.

## Minimal setup

```tsx
import {
  createEditorSystem,
  richTextExtension,
  boldExtension,
  italicExtension,
  RichText,
} from "@lyfie/luthor-headless";

const extensions = [richTextExtension, boldExtension, italicExtension] as const;
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

export function Editor() {
  return (
    <Provider extensions={extensions} config={{ namespace: "MyEditor" }}>
      <Toolbar />
      <RichText placeholder="Write something..." />
    </Provider>
  );
}
```

## Next docs

- Extension catalog and configuration: [extensions-and-configuration.md](extensions-and-configuration.md)
- Import/export and metadata format: [import-export.md](import-export.md)
- Troubleshooting and performance notes: [../../developer/headless/maintainer-notes.md](../../developer/headless/maintainer-notes.md)
