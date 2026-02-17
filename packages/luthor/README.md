# @lyfie/luthor

Batteries-included presets and UI-ready editor experience built on top of `@lyfie/luthor-headless`.

## Installation

```bash
# npm
npm install @lyfie/luthor @lyfie/luthor-headless

# pnpm
pnpm add @lyfie/luthor @lyfie/luthor-headless
```

`@lyfie/luthor` includes Lexical packages as dependencies, so you do not need to install `lexical` and `@lexical/*` separately when using this package.

## Quick Start

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## Exports

From `src/presets/index.ts`, this package exports:

- Presets: `minimalPreset`, `classicPreset`, `docsPreset`, `blogPreset`, `cmsPreset`, `chatPreset`, `emailPreset`, `markdownPreset`, `codePreset`, `defaultPreset`, `extensivePreset`
- Registry: `presetRegistry`
- Extensive package UI: `ExtensiveEditor`, `extensiveExtensions`
- Helpers: `createPresetEditorConfig`

## React Peer Dependencies

- `react`: `^18.0.0 || ^19.0.0`
- `react-dom`: `^18.0.0 || ^19.0.0`

## Package Links

- Headless core package docs: [../headless/README.md](../headless/README.md)
- Monorepo root docs: [../../README.md](../../README.md)
- Central docs index: [../../documentation/README.md](../../documentation/README.md)
- Developer README map: [../../documentation/developer_notes/README.md](../../documentation/developer_notes/README.md)

## Development (Workspace)

From repo root:

```bash
pnpm dev --filter @lyfie/luthor
pnpm build --filter @lyfie/luthor
pnpm lint --filter @lyfie/luthor
```