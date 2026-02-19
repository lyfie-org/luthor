# Luthor Monorepo

Luthor is a TypeScript-first rich text editor monorepo built on Lexical, organized into a headless extension runtime and a plug-and-play preset package.

## Packages

- `@lyfie/luthor-headless` (version `2.2.0`)
	- Lightweight headless extension system.
	- Owns Lexical-derived core features and extension implementations.
	- README: [packages/headless/README.md](packages/headless/README.md)
- `@lyfie/luthor` (version `2.2.0`)
	- Preset-focused package with ready editor UX.
	- Composes and re-exports headless APIs.
	- README: [packages/luthor/README.md](packages/luthor/README.md)

## Workspace Setup

Requirements:

- Node `>=20`
- `pnpm@10.4.1`

Install and run:

```bash
pnpm install
pnpm dev
```

Quality gates:

```bash
pnpm build
pnpm lint
pnpm format
```

## Documentation (Canonical Source)

All long-form project documentation is centralized in [documentation](documentation).

Primary indexes:

- [documentation/index.md](documentation/index.md)
- [documentation/documentation-hub.md](documentation/documentation-hub.md)
- [documentation/markdown-catalog.md](documentation/markdown-catalog.md)

## User Documentation

### Demo App (`apps/demo`)

- Getting started: [documentation/user/demo/getting-started.md](documentation/user/demo/getting-started.md)
- Usage and persistence: [documentation/user/demo/usage-and-persistence.md](documentation/user/demo/usage-and-persistence.md)

### `@lyfie/luthor`

- Getting started: [documentation/user/luthor/getting-started.md](documentation/user/luthor/getting-started.md)
- Presets and configuration: [documentation/user/luthor/presets-and-configuration.md](documentation/user/luthor/presets-and-configuration.md)
- Extensive editor guide: [documentation/user/luthor/extensive-editor.md](documentation/user/luthor/extensive-editor.md)

### `@lyfie/luthor-headless`

- Getting started: [documentation/user/headless/getting-started.md](documentation/user/headless/getting-started.md)
- Extensions and configuration: [documentation/user/headless/extensions-and-configuration.md](documentation/user/headless/extensions-and-configuration.md)
- Import/export: [documentation/user/headless/import-export.md](documentation/user/headless/import-export.md)

### Tutorials

- Enhanced markdown quick start: [documentation/tutorials/enhanced-markdown-quick-start.md](documentation/tutorials/enhanced-markdown-quick-start.md)

## Developer Documentation

### Demo App (`apps/demo`)

- Architecture: [documentation/developer/demo/architecture.md](documentation/developer/demo/architecture.md)
- Source file reference: [documentation/developer/demo/source-file-reference.md](documentation/developer/demo/source-file-reference.md)
- Maintainer notes: [documentation/developer/demo/maintainer-notes.md](documentation/developer/demo/maintainer-notes.md)

### `@lyfie/luthor`

- Architecture: [documentation/developer/luthor/architecture.md](documentation/developer/luthor/architecture.md)
- Source file reference (all `packages/luthor/src` files): [documentation/developer/luthor/source-file-reference.md](documentation/developer/luthor/source-file-reference.md)
- Maintainer notes: [documentation/developer/luthor/maintainer-notes.md](documentation/developer/luthor/maintainer-notes.md)

### `@lyfie/luthor-headless`

- Architecture: [documentation/developer/headless/architecture.md](documentation/developer/headless/architecture.md)
- Source file reference: [documentation/developer/headless/source-file-reference.md](documentation/developer/headless/source-file-reference.md)
- Maintainer notes: [documentation/developer/headless/maintainer-notes.md](documentation/developer/headless/maintainer-notes.md)

### Contributor maps and package docs

- README map: [documentation/developer_notes/readme-map.md](documentation/developer_notes/readme-map.md)
- Luthor legacy docs redirects: [documentation/readmes/packages/luthor-docs/README.md](documentation/readmes/packages/luthor-docs/README.md)
- Extensive preset notes: [documentation/readmes/presets/extensive-preset-readme.md](documentation/readmes/presets/extensive-preset-readme.md)

## Repository Layout

- [apps/demo](apps/demo): demo playground app
- [packages/headless](packages/headless): headless runtime package
- [packages/luthor](packages/luthor): preset package
- [packages/ui](packages/ui): shared UI package
- [packages/eslint-config](packages/eslint-config): lint config package
- [packages/typescript-config](packages/typescript-config): TypeScript config package
