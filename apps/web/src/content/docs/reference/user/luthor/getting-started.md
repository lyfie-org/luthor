---
title: "`@lyfie/luthor` Getting Started"
---

# `@lyfie/luthor` Getting Started

`@lyfie/luthor` is the plug-and-play package in this monorepo. It ships presets, pre-composed UI, and re-exports headless APIs.

## Package and compatibility

- Package: `@lyfie/luthor`
- Current version: `2.2.0`
- React peer dependencies: `^18.0.0 || ^19.0.0`
- Lexical runtime dependencies: bundled by this package (`^0.40.0` family)

## Install

```bash
pnpm add @lyfie/luthor react react-dom
```

## Basic usage

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## What you get by default (Extensive preset)

- rich text formatting and block controls
- command palette and slash commands
- floating toolbar and contextual actions
- image, iframe, and YouTube embedding support
- tables, lists, code/code-block, typography and color tools
- visual/source mode switching (`visual`, `jsonb`)

## Headless access from the same package

```ts
import { headless } from "@lyfie/luthor";

const { createEditorSystem, richTextExtension } = headless;
```

Use this when you want gradual migration from preset usage to custom extension composition.

## Next steps

- Preset options and configuration: [presets-and-configuration.md](/docs/reference/user/luthor/presets-and-configuration/)
- Extensive editor props and capabilities: [extensive-editor.md](/docs/reference/user/luthor/extensive-editor/)
- Developer architecture (if contributing): [../../developer/luthor/architecture.md](/docs/reference/developer/luthor/architecture/)
