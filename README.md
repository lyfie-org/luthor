<div align="center">
  <img src="apps/web/public/luthor-logo-horizontal.png" alt="Luthor" width="420" />
  <p><strong>TypeScript-first rich text editor ecosystem for React, built on Lexical.</strong></p>
  <p>:rocket: Production-ready presets + :jigsaw: headless extension runtime + :unlock: MIT license</p>
</div>

<div align="center">

[![Quality Gates](https://img.shields.io/github/actions/workflow/status/lyfie-app/luthor/quality-gates.yml?branch=main&label=quality%20gates&style=for-the-badge)](https://github.com/lyfie-app/luthor/actions/workflows/quality-gates.yml)
[![Publish Packages](https://img.shields.io/github/actions/workflow/status/lyfie-app/luthor/publish-packages.yml?branch=main&label=publish&style=for-the-badge)](https://github.com/lyfie-app/luthor/actions/workflows/publish-packages.yml)
[![GitHub Release](https://img.shields.io/github/v/release/lyfie-app/luthor?style=for-the-badge)](https://github.com/lyfie-app/luthor/releases)
[![Last Commit](https://img.shields.io/github/last-commit/lyfie-app/luthor/main?style=for-the-badge)](https://github.com/lyfie-app/luthor/commits/main)
[![NPM - @lyfie/luthor](https://img.shields.io/npm/v/@lyfie/luthor?style=for-the-badge&label=@lyfie/luthor)](https://www.npmjs.com/package/@lyfie/luthor)
[![NPM - @lyfie/luthor-headless](https://img.shields.io/npm/v/@lyfie/luthor-headless?style=for-the-badge&label=@lyfie/luthor-headless)](https://www.npmjs.com/package/@lyfie/luthor-headless)

</div>

<p align="center">
  <img src="apps/web/public/placeholders/feature-preview.gif" alt="Luthor feature preview" width="960" />
</p>

## :sparkles: Why Luthor

Luthor is an open-source rich text editor ecosystem designed for teams that want modern DX without editor lock-in.

- :package: **Two-package model**: start fast with presets, go deep with headless composition
- :shield: **TypeScript-first APIs**: safe command/state integrations
- :zap: **Lexical-powered**: modern performance and extensibility
- :art: **UI freedom**: build custom editor experiences when product requirements evolve
- :package: **ESM-first distribution**: optimized for modern React bundling

## :package: Packages

| Package | Purpose | Best for | npm |
| --- | --- | --- | --- |
| `@lyfie/luthor` | Plug-and-play editor presets + polished UI | Shipping quickly with minimal setup | [npm](https://www.npmjs.com/package/@lyfie/luthor) |
| `@lyfie/luthor-headless` | Headless extension runtime and typed editor system | Full UI control and custom workflows | [npm](https://www.npmjs.com/package/@lyfie/luthor-headless) |

## :rocket: Quick Start

```bash
pnpm add @lyfie/luthor react react-dom
```

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

Need full control?

```bash
pnpm add @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

## :globe_with_meridians: Product Links

- Website: [luthor.fyi](https://www.luthor.fyi)
- Docs home: [luthor.fyi/docs/getting-started](https://www.luthor.fyi/docs/getting-started)
- Live demo: [luthor.fyi/demo](https://www.luthor.fyi/demo)
- GitHub: [lyfie-app/luthor](https://github.com/lyfie-app/luthor)
- Sponsor: [github.com/sponsors/lyfie-app](https://github.com/sponsors/lyfie-app)

## :books: Documentation

Public-facing docs:

- Luthor getting started: [documentation/user/luthor/getting-started.md](documentation/user/luthor/getting-started.md)
- Luthor presets/config: [documentation/user/luthor/presets-and-configuration.md](documentation/user/luthor/presets-and-configuration.md)
- Luthor extensive editor: [documentation/user/luthor/extensive-editor.md](documentation/user/luthor/extensive-editor.md)
- Headless getting started: [documentation/user/headless/getting-started.md](documentation/user/headless/getting-started.md)
- Headless extensions/config: [documentation/user/headless/extensions-and-configuration.md](documentation/user/headless/extensions-and-configuration.md)
- Headless import/export: [documentation/user/headless/import-export.md](documentation/user/headless/import-export.md)

Developer/maintainer docs:

- Documentation index: [documentation/index.md](documentation/index.md)
- Documentation hub: [documentation/documentation-hub.md](documentation/documentation-hub.md)
- Markdown catalog: [documentation/markdown-catalog.md](documentation/markdown-catalog.md)
- README map: [documentation/developer_notes/readme-map.md](documentation/developer_notes/readme-map.md)
- Luthor architecture: [documentation/developer/luthor/architecture.md](documentation/developer/luthor/architecture.md)
- Headless architecture: [documentation/developer/headless/architecture.md](documentation/developer/headless/architecture.md)

## :computer: Monorepo Development

Requirements:

- Node `>=20`
- `pnpm@10.4.1`

Install + run:

```bash
pnpm install
pnpm dev
```

Quality gates:

```bash
pnpm build
pnpm lint
pnpm format
pnpm size:check
pnpm check:rule-contracts
```

Windows + WSL split workflow (Cloudflare/OpenNext operations):

```bash
pnpm run web:preview:wsl
pnpm run web:deploy:wsl
```

## :handshake: Contributing

1. Fork + clone the repo.
2. Create a feature branch.
3. Run checks locally (`pnpm lint`, `pnpm build`, `pnpm test` where applicable).
4. Open a PR with a clear scope and screenshots/GIFs for UI changes.

Issue tracker: [github.com/lyfie-app/luthor/issues](https://github.com/lyfie-app/luthor/issues)

## :chart_with_upwards_trend: Community

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lyfie-app/luthor&type=Date)](https://star-history.com/#lyfie-app/luthor&Date)

### Contributors

[![Contributors](https://contrib.rocks/image?repo=lyfie-app/luthor)](https://github.com/lyfie-app/luthor/graphs/contributors)

## :page_facing_up: License

MIT (c) Luthor Team
