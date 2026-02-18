# Luthor Monorepo

Luthor is a pnpm + Turbo monorepo for a type-safe rich text editor system built on Lexical.

- `@lyfie/luthor-headless`: headless extension framework and editor runtime
- `@lyfie/luthor`: batteries-included presets and ready-to-use `ExtensiveEditor`

## Package Documentation

- Headless package (`@lyfie/luthor-headless`): [packages/headless/README.md](packages/headless/README.md)
- Preset package (`@lyfie/luthor`): [packages/luthor/README.md](packages/luthor/README.md)
- Central documentation index: [documentation/documentation-hub.md](documentation/documentation-hub.md)

## Repository Structure

- [apps/web](apps/web): Next.js docs/demo site
- [apps/demo](apps/demo): Vite playground app
- [packages/headless](packages/headless): source for `@lyfie/luthor-headless`
- [packages/luthor](packages/luthor): source for `@lyfie/luthor`
- [packages/ui](packages/ui): shared UI library for the docs site
- [packages/eslint-config](packages/eslint-config): shared ESLint presets
- [packages/typescript-config](packages/typescript-config): shared TypeScript presets

## Workspace Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format
```

## Architecture

High-level architecture notes live in [architecture.md](architecture.md).

## Developer Documentation Hub

All Markdown docs are cataloged under [documentation/documentation-hub.md](documentation/documentation-hub.md), and all README references for contributors are grouped in [documentation/developer_notes/readme-map.md](documentation/developer_notes/readme-map.md).
