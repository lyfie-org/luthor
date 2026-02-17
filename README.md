# Luthor Monorepo

Luthor is a pnpm + Turbo monorepo for a headless, type-safe rich text editor built on Lexical. It contains the core editor library, a Next.js documentation/demo site, shared UI components, and shared tooling configs.

If you want a shorter, architecture-only summary, see [architecture.md](architecture.md).

## 📦 Published Packages

Luthor provides two npm packages designed to work together:

### 1. **@lyfie/luthor-headless** - Lightweight & Flexible

The core headless editor library for developers who want complete control.

- **Fully headless** - Build any UI you want
- **Type-safe** - Commands and states inferred from extensions
- **Modular** - Only include what you need
- **Lightweight** - No bundled dependencies

**📖 [View Full Documentation](packages/headless/README.md)**

**Installation:**
```bash
npm install @lyfie/luthor-headless
# Install peer dependencies
npm install lexical @lexical/react @lexical/html @lexical/markdown @lexical/list @lexical/rich-text @lexical/selection @lexical/utils @lexical/code @lexical/link @lexical/table
```

### 2. **@lyfie/luthor** - Batteries Included

Ready-to-use presets and configurations built on top of luthor-headless.

- **Zero additional setup** - All Lexical dependencies included
- **Multiple presets** - Minimal, Classic, Blog, CMS, Docs, and more
- **Plug-and-play** - Ready-to-use editor components
- **Extensible** - Customize any preset to your needs

**📖 [View Full Documentation](packages/luthor/README.md)**

**Installation:**
```bash
npm install @lyfie/luthor-headless
npm install @lyfie/luthor
# That's it! All dependencies are included
```

## 🚀 Quick Start

### Option 1: Headless (Maximum Control)

Perfect when you want to build your own UI from scratch:

```tsx
import { createEditorSystem, boldExtension, italicExtension } from "@lyfie/luthor-headless";

const extensions = [boldExtension, italicExtension] as const;
const { Provider, useEditor } = createEditorSystem<typeof extensions>();
// Build your custom UI...
```

[→ See headless package documentation](packages/headless/README.md)

### Option 2: Presets (Quick Setup)

Perfect when you want a ready-to-use editor:

```tsx
import { ExtensiveEditor } from "@lyfie/luthor";

function App() {
  return <ExtensiveEditor placeholder="Start writing..." />;
}
```

[→ See luthor package documentation](packages/luthor/README.md)

## Repository Map

- [apps/web](apps/web): Next.js 15 site for docs, demos, and examples.
- [packages/headless](packages/headless): Core editor library published as `@lyfie/luthor-headless`.
- [packages/luthor](packages/luthor): Presets and plug-and-play configs published as `@lyfie/luthor`.
- [packages/ui](packages/ui): Shared UI component library used by the site.
- [packages/eslint-config](packages/eslint-config): Shared ESLint configs for the workspace.
- [packages/typescript-config](packages/typescript-config): Shared TypeScript configs for the workspace.
- [turbo.json](turbo.json): Task graph and caching rules.
- [pnpm-workspace.yaml](pnpm-workspace.yaml): Workspace package globs.
- [tsconfig.json](tsconfig.json): Root TypeScript config (base for workspace).

## How The Pieces Fit Together

- The web app in [apps/web](apps/web) consumes `@lyfie/luthor-headless` and `@repo/ui` via workspace dependencies.
- The editor library in [packages/headless](packages/headless) is headless and provides the core extension system; the web app builds UI around it.
- The presets package in [packages/luthor](packages/luthor) depends on luthor-headless and provides all required Lexical dependencies plus ready-to-use preset definitions for plug-and-play setups.
- The UI library in [packages/ui](packages/ui) hosts reusable React components (Radix UI based) and is used by the web app.
- Shared linting and TypeScript configs in [packages/eslint-config](packages/eslint-config) and [packages/typescript-config](packages/typescript-config) are imported by app and package tsconfig/eslint config files.
- Turbo in [turbo.json](turbo.json) orchestrates builds and caches outputs across all packages.

### Package Dependency Flow

```
@lyfie/luthor
    ├─> @lyfie/luthor-headless (dependency)
    ├─> lexical + @lexical/* packages (bundled as dependencies)
    └─> react + react-dom (peer dependency - user provides)

@lyfie/luthor-headless
    ├─> lexical + @lexical/* packages (peer dependencies - user provides)
    └─> react + react-dom (peer dependency - user provides)
```

When users install `@lyfie/luthor`, npm automatically:
1. Installs `@lyfie/luthor-headless`
2. Installs all Lexical packages
3. These satisfy the peer dependencies of luthor-headless
4. **Zero additional installations needed** ✅

## Apps

### Web App (apps/web)

The Next.js App Router site that hosts documentation, examples, and demos.

Key folders and what they do:

- [apps/web/app](apps/web/app): App Router entry point and route groups.
- [apps/web/app/(docs)](apps/web/app/(docs)): Documentation site routes and layout.
- [apps/web/app/(main)](apps/web/app/(main)): Landing page and demo routes.
- [apps/web/components](apps/web/components): Site UI components (navigation, layout helpers, templates).
- [apps/web/lib](apps/web/lib): Site utilities, state, and code loading.
- [apps/web/public](apps/web/public): Static assets and metadata (robots, sitemap, icons).
- [apps/web/scripts](apps/web/scripts): Code generation scripts for docs and examples.

Build and deployment:

- The build script runs a registry generation step before Next.js build.
- Cloudflare Pages deployment is wired via `next-on-pages` and `wrangler` scripts.

## Packages

### Core Editor (packages/headless)

The editor library published as `@lyfie/luthor-headless`.

Key folders and what they do:

- [packages/headless/src/core](packages/headless/src/core): Editor system, extension base types, and theming.
- [packages/headless/src/extensions](packages/headless/src/extensions): Built-in extensions (formatting, media, tables, exports, etc.).
- [packages/headless/docs](packages/headless/docs): User-facing documentation and API reference for the editor.

Build output:

- Bundled via `tsup` to [packages/headless/dist](packages/headless/dist).

### Presets Package (packages/luthor)

Presets and plug-and-play configurations published as `@lyfie/luthor`.

Key folders and what they do:

- [packages/luthor/src/presets](packages/luthor/src/presets): Preset definitions and registry.

Build output:

- Bundled via `tsup` to [packages/luthor/dist](packages/luthor/dist).

### UI Library (packages/ui)

Shared component library used by the web app.

Key folders and what they do:

- [packages/ui/src/components](packages/ui/src/components): Radix-based UI components.
- [packages/ui/src/hooks](packages/ui/src/hooks): Shared React hooks.
- [packages/ui/src/lib](packages/ui/src/lib): Utilities and helpers.
- [packages/ui/src/styles](packages/ui/src/styles): Global styles and Tailwind setup.

Exports are defined in [packages/ui/package.json](packages/ui/package.json) to allow direct imports like `@repo/ui/components/button`.

### Tooling Packages

- [packages/eslint-config](packages/eslint-config): Shared ESLint rulesets.
- [packages/typescript-config](packages/typescript-config): Base tsconfig presets (base, nextjs, react-library).

## Dependency Overview

This is a high-level summary of where key dependencies live. See each package.json for full lists.

### Root Tooling

- pnpm workspaces and Turbo orchestrate the monorepo.
- Prettier formats TypeScript and Markdown.

### apps/web

- Next.js 15 + React 19 for the docs site.
- Lexical packages and `@lyfie/luthor-headless` for the editor demos.
- `@repo/ui` for shared UI.
- Shiki and rehype tooling for code highlighting.
- Zustand for local state.

### packages/headless

- No runtime dependencies; Lexical and React are peer dependencies.
- Uses tsup for bundling and eslint for linting.

### packages/ui

- Radix UI primitives and UI utilities (class-variance-authority, clsx, tailwind-merge).
- Form helpers (react-hook-form, zod).

## Scripts

Root scripts from [package.json](package.json):

```bash
pnpm dev        # run turbo dev across workspace
pnpm build      # run turbo build across workspace
pnpm lint       # run turbo lint across workspace
pnpm format     # prettier over ts/tsx/md files
```

Web app scripts from [apps/web/package.json](apps/web/package.json):

```bash
pnpm dev --filter web
pnpm build --filter web
pnpm pages:build --filter web
pnpm deploy --filter web
```

## Build Graph (Turbo)

Turbo tasks are defined in [turbo.json](turbo.json):

- `build` depends on upstream builds and caches dist and .next outputs.
- `lint` and `check-types` fan out to all packages.
- `dev` runs without caching and stays persistent.

## Where To Start

- Product overview and architecture: [architecture.md](architecture.md)
- Editor package docs and API reference: [packages/headless/docs](packages/headless/docs)
- Site source (docs and demos): [apps/web](apps/web)




