<div align="center">
  <img src="https://raw.githubusercontent.com/lyfie-app/luthor/main/apps/web/public/luthor-logo-horizontal.png" alt="Luthor" width="360" />
  <h1>@lyfie/luthor-headless</h1>
  <p><strong>Headless, extension-first rich text editor runtime for React on top of Lexical.</strong></p>
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/@lyfie/luthor-headless?style=flat-square)](https://www.npmjs.com/package/@lyfie/luthor-headless)
[![npm downloads](https://img.shields.io/npm/dm/@lyfie/luthor-headless?style=flat-square)](https://www.npmjs.com/package/@lyfie/luthor-headless)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@lyfie/luthor-headless?style=flat-square)](https://bundlephobia.com/package/@lyfie/luthor-headless)
[![types](https://img.shields.io/npm/types/@lyfie/luthor-headless?style=flat-square)](https://www.npmjs.com/package/@lyfie/luthor-headless)
[![license](https://img.shields.io/npm/l/@lyfie/luthor-headless?style=flat-square)](https://github.com/lyfie-app/luthor/blob/main/LICENSE)
[![last commit](https://img.shields.io/github/last-commit/lyfie-app/luthor/main?style=flat-square)](https://github.com/lyfie-app/luthor/commits/main)

</div>

<p align="center">
  :jigsaw: Build your own editor UI | :shield: Typed command/state API | :zap: Lexical performance
</p>

## Install

```bash
pnpm add @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

Optional:

```bash
pnpm add highlight.js @emoji-mart/data
```

## Quick Usage

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

## Highlights

- :gear: Extension-first architecture with configurable behaviors
- :brain: Type-safe command and active-state surface
- :building_construction: Compose only what your product needs
- :floppy_disk: JSON/JSONB-first import/export workflow
- :art: Bring your own toolbar and design system

## Compatibility

- Node: `>=20` (workspace development)
- React: `^18.0.0 || ^19.0.0`
- Lexical + `@lexical/*`: `>=0.40.0`
- Optional `highlight.js`: `>=11.0.0`

## Documentation

- Docs landing: [luthor.fyi/docs/getting-started/luthor-headless](https://www.luthor.fyi/docs/getting-started/luthor-headless)
- Features docs: [luthor.fyi/docs/luthor-headless/features](https://www.luthor.fyi/docs/luthor-headless/features)
- User guide (repo): [documentation/user/headless/getting-started.md](https://github.com/lyfie-app/luthor/blob/main/documentation/user/headless/getting-started.md)
- Extensions/config: [documentation/user/headless/extensions-and-configuration.md](https://github.com/lyfie-app/luthor/blob/main/documentation/user/headless/extensions-and-configuration.md)
- Import/export: [documentation/user/headless/import-export.md](https://github.com/lyfie-app/luthor/blob/main/documentation/user/headless/import-export.md)

## Related Packages

- Plug-and-play presets: [`@lyfie/luthor`](https://www.npmjs.com/package/@lyfie/luthor)

## License

MIT (c) Luthor Team
