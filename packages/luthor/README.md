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
- `HeadlessEditorPreset`

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
