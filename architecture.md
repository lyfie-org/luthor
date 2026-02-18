# Luthor Architecture

## Overview

Luthor is a pnpm workspace orchestrated by Turbo. It ships two npm packages:

- `@lyfie/luthor-headless`: the extension-based headless editor core
- `@lyfie/luthor`: presets and UI-ready editor composition on top of headless

## Monorepo Layout

```text
luthor/
├─ apps/
│  ├─ web/                  # Next.js docs + examples + demo pages
│  └─ demo/                 # Vite playground app
├─ packages/
│  ├─ headless/             # @lyfie/luthor-headless
│  ├─ luthor/               # @lyfie/luthor
│  ├─ ui/                   # shared UI package for web app
│  ├─ eslint-config/        # shared lint config
│  └─ typescript-config/    # shared tsconfig presets
├─ turbo.json
├─ pnpm-workspace.yaml
└─ package.json
```

## Build and Task Graph

- Root scripts fan out through Turbo (`build`, `dev`, `lint`, `check-types`)
- `build` depends on upstream package builds (`^build`)
- Task outputs include `dist/**` and `.next/**` for caching
- `dev` runs as a persistent, uncached task

## Package Relationships

- `@lyfie/luthor` depends on `@lyfie/luthor-headless`
- `@lyfie/luthor-headless` defines Lexical and React as peers
- `@lyfie/luthor` bundles Lexical dependencies directly for easier onboarding

## Documentation Topology

- Root entrypoint: [README.md](README.md)
- Central catalog: [documentation/documentation-hub.md](documentation/documentation-hub.md)
- Developer notes and README mapping: [documentation/developer_notes/readme-map.md](documentation/developer_notes/readme-map.md)
- Headless package docs: [packages/headless/docs](packages/headless/docs)
