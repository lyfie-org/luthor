# @lyfie/luthor

Plug-and-play preset package built on top of `@lyfie/luthor-headless`.

## Package scope

- Provides out-of-the-box editor presets and pre-composed UX.
- Depends on and composes `@lyfie/luthor-headless`.
- Re-exports headless capabilities for teams that want one package entrypoint.

## Version and compatibility

- Package version: `2.2.0`
- React peer dependencies: `^18.0.0 || ^19.0.0`
- Lexical dependencies are included directly in this package (`^0.40.0` family).
- Icon dependency: `lucide-react ^0.475.0`

## Installation

```bash
pnpm add @lyfie/luthor react react-dom
```

## Quick start

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";
import "@lyfie/luthor/styles.css";

export function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

## Primary exports

- Presets: `extensivePreset`
- Preset registry: `presetRegistry`
- Ready component: `ExtensiveEditor`
- Shared extension bundle: `extensiveExtensions`
- Preset config helper: `createPresetEditorConfig`
- Headless passthrough namespace: `headless`

## Headless access from this package

```tsx
import { headless } from "@lyfie/luthor";

const { createEditorSystem, boldExtension } = headless;
```

## Extensive preset capabilities

- rich text and formatting controls
- command palette and slash commands
- floating toolbar and context-aware actions
- media support (image, iframe, YouTube)
- visual/source modes with conversions (`visual`, `html`, `markdown`, `jsonb`)

## Which package should you use?

- Use `@lyfie/luthor` if you want fast setup and opinionated defaults.
- Use `@lyfie/luthor-headless` if you want full control over extension selection and UI composition.

## Documentation

Canonical docs root: [../../documentation/index.md](../../documentation/index.md)

### User docs

- Luthor getting started: [../../documentation/user/luthor/getting-started.md](../../documentation/user/luthor/getting-started.md)
- Presets and configuration: [../../documentation/user/luthor/presets-and-configuration.md](../../documentation/user/luthor/presets-and-configuration.md)
- Extensive editor guide: [../../documentation/user/luthor/extensive-editor.md](../../documentation/user/luthor/extensive-editor.md)

### Developer docs

- Luthor architecture: [../../documentation/developer/luthor/architecture.md](../../documentation/developer/luthor/architecture.md)
- Luthor source-file reference: [../../documentation/developer/luthor/source-file-reference.md](../../documentation/developer/luthor/source-file-reference.md)
- Luthor maintainer notes: [../../documentation/developer/luthor/maintainer-notes.md](../../documentation/developer/luthor/maintainer-notes.md)

### Related docs

- Monorepo README: [../../README.md](../../README.md)
- Headless package README: [../headless/README.md](../headless/README.md)
- Legacy luthor docs redirects: [../../documentation/readmes/packages/luthor-docs/README.md](../../documentation/readmes/packages/luthor-docs/README.md)
- Demo getting started: [../../documentation/user/demo/getting-started.md](../../documentation/user/demo/getting-started.md)
- Demo architecture: [../../documentation/developer/demo/architecture.md](../../documentation/developer/demo/architecture.md)

## Workspace development

From repository root:

```bash
pnpm --filter @lyfie/luthor dev
pnpm --filter @lyfie/luthor build
pnpm --filter @lyfie/luthor lint
```
