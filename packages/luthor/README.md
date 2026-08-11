<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/luthor-logo-horizontal-dark.png" />
    <img src="https://raw.githubusercontent.com/lyfie-org/luthor/main/apps/web/public/luthor-logo-horizontal-light.png" alt="Luthor" width="360" />
  </picture>
  <h1>@lyfie/luthor</h1>
  <p><strong>Plug-and-play rich text editor presets for React, powered by Luthor Headless + Lexical.</strong></p>
</div>

<div align="center">


[![npm version](https://img.shields.io/npm/v/@lyfie/luthor?style=flat-square)](https://www.npmjs.com/package/@lyfie/luthor)
[![license](https://img.shields.io/npm/l/@lyfie/luthor?style=flat-square)](https://github.com/lyfie-org/luthor/blob/main/LICENSE)
[![Quality Gates](https://img.shields.io/github/actions/workflow/status/lyfie-org/luthor/quality-gates.yml?branch=main&label=QA&style=for-the-badge)](https://github.com/lyfie-org/luthor/actions/workflows/publish-packages.yml)

</div>

<p align="center">
  :rocket: Ship fast | :control_knobs: Customize deeply | :white_check_mark: Production-ready presets
</p>

## Install

```bash
pnpm add @lyfie/luthor react react-dom
```

## Quick Usage

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## Autosave: use `onChange`, not DOM `onInput`

Lexical stops propagation of the contenteditable's `input` event, so a React
`onInput` handler on a wrapper element **never fires** — an autosave wired that
way silently saves nothing. Every preset exposes a first-class `onChange`
instead, coalesced to one call per committed change:

```tsx
<ExtensiveEditor
  defaultContent={body}
  onChange={({ markdown, source, isDirty }) => {
    if (source !== "user" || !isDirty) return; // ignore your own adopts
    scheduleAutosave(markdown);                // your debounce
  }}
/>
```

It fires for every mutation path (typing, toolbar, slash commands, undo/redo,
paste, drag-drop, the markdown source view). The initial `defaultContent` load
never fires; host-initiated adopts fire as `source: "programmatic"`. `onReady`
fires only after the initial content has reconciled, so `getMarkdown()` inside
it is a stable dirty-check baseline — note the editor re-normalises markdown it
imports, so always baseline against its own output, never your input string.

## What You Get

- :sparkles: `ExtensiveEditor` with rich defaults and polished UX
- :toolbox: Built-in toolbars, slash commands, floating actions, source mode
- :framed_picture: Media and embed workflows (image, iframe, YouTube)
- :shield: TypeScript-first APIs and reusable preset architecture
- :twisted_rightwards_arrows: Headless escape hatch via `headless` re-export

## Presets Included

- `ExtensiveEditor`
- `MarkDownEditor`
- `HTMLEditor`
- `LegacyRichEditor`
- `PapyraEditor`

## Compatibility

- React: `^18.0.0 || ^19.0.0`
- React DOM: `^18.0.0 || ^19.0.0`
- Lexical family: `^0.40.0`

## Documentation

- Docs landing: [luthor.fyi/docs/getting-started/luthor](https://www.luthor.fyi/docs/getting-started/luthor)
- Presets docs: [luthor.fyi/docs/luthor/presets](https://www.luthor.fyi/docs/luthor/presets)
- User guide (repo): [documentation/user/luthor/getting-started.md](https://github.com/lyfie-org/luthor/blob/main/documentation/user/luthor/getting-started.md)
- Presets/config: [documentation/user/luthor/presets-and-configuration.md](https://github.com/lyfie-org/luthor/blob/main/documentation/user/luthor/presets-and-configuration.md)
- Extensive editor guide: [documentation/user/luthor/extensive-editor.md](https://github.com/lyfie-org/luthor/blob/main/documentation/user/luthor/extensive-editor.md)

## Need Headless Control?

Use [`@lyfie/luthor-headless`](https://www.npmjs.com/package/@lyfie/luthor-headless) when you want total UI and extension composition control.

## License

MIT (c) Luthor Team
