<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/luthor-logo-horizontal-dark.png" />
    <img src="https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/luthor-logo-horizontal-light.png" alt="Luthor" width="360" />
  </picture>
  <h1>@lyfie/luthor-headless</h1>
  <p><strong>Headless, extension-first rich text editor runtime for React on top of Lexical.</strong></p>
</div>

<div align="center">


[![npm version](https://img.shields.io/npm/v/@lyfie/luthor-headless?style=flat-square)](https://www.npmjs.com/package/@lyfie/luthor-headless)
[![license](https://img.shields.io/npm/l/@lyfie/luthor?style=flat-square)](https://github.com/lyfie-org/luthor/blob/main/LICENSE)
[![Quality Gates](https://img.shields.io/github/actions/workflow/status/lyfie-org/luthor/quality-gates.yml?branch=main&label=QA&style=for-the-badge)](https://github.com/lyfie-org/luthor/actions/workflows/publish-packages.yml)
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
pnpm add @emoji-mart/data      # emoji picker data
pnpm add yjs @lexical/yjs      # live collaboration (@lyfie/luthor-headless/collab)
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
- :floppy_disk: JSON-first import/export workflow
- :art: Bring your own toolbar and design system
- :framed_picture: Media primitives: sized `![[file|480]]` grammar, `MediaFrame` (select, pointer resize, in-frame toolbar), host resolvers for URLs/thumbnails/metadata, upload pipeline with placeholders
- :busts_in_silhouette: `@lyfie/luthor-headless/collab`: `CollaborationExtension` + `createHeadlessCollabSession` for a DOM-free server

## Compatibility

- Node: `>=20` (workspace development)
- React: `^18.0.0 || ^19.0.0`
- Lexical + `@lexical/*`: `>=0.40.0`
- Optional `@emoji-mart/data`: `^1.2.1`

## Documentation

- Docs landing: [luthor.fyi/docs/luthor-headless/overview](https://www.luthor.fyi/docs/luthor-headless/overview/)
- Quick start: [luthor.fyi/docs/getting-started/quickstart-headless](https://www.luthor.fyi/docs/getting-started/quickstart-headless/)
- Features: [luthor.fyi/docs/luthor-headless/features](https://www.luthor.fyi/docs/luthor-headless/features/)
- Media and embeds: [luthor.fyi/docs/luthor-headless/features/media-and-embeds](https://www.luthor.fyi/docs/luthor-headless/features/media-and-embeds/)
- Collaboration: [luthor.fyi/docs/luthor-headless/features/collaboration](https://www.luthor.fyi/docs/luthor-headless/features/collaboration/)
- Import/export bridges: [luthor.fyi/docs/luthor-headless/nodes-and-bridges-reference](https://www.luthor.fyi/docs/luthor-headless/nodes-and-bridges-reference/)

## Related Packages

- Plug-and-play presets: [`@lyfie/luthor`](https://www.npmjs.com/package/@lyfie/luthor)

## License

MIT (c) Luthor Team
