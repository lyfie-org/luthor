---
title: Dependency Graph
description: Full dependency map for @lyfie/luthor and @lyfie/luthor-headless, including transitive paths for conflict debugging.
---

# Dependency Graph

This page exists for one reason: help users fight dependency drama.

It shows exactly which package depends on what, with explicit transitive paths so you can debug version conflicts quickly.

## Scope and snapshot

- This graph is based on the current repository versions (`@lyfie/luthor@2.7.7`, `@lyfie/luthor-headless@2.7.7`).
- Paths shown here were generated from the production dependency tree in this monorepo.
- Package managers may dedupe differently, but the package relationships stay the same.

## `@lyfie/luthor-headless` baseline (clean contract)

`@lyfie/luthor-headless` intentionally keeps required runtime dependencies at zero.

- `dependencies`: none
- `peerDependencies`: `lexical`, `@lexical/*`, `react`, `react-dom`
- `optionalDependencies`: `@emoji-mart/data`

This keeps headless lightweight, while still allowing optional features without forcing extra installs.

## `@lyfie/luthor` direct dependency contract

`@lyfie/luthor` is the plug-and-play package, so it ships with direct runtime dependencies:

| Package | Type |
| --- | --- |
| `@lyfie/luthor-headless` | Non-lexical |
| `lexical` | Lexical |
| `@lexical/code` | Lexical |
| `@lexical/html` | Lexical |
| `@lexical/link` | Lexical |
| `@lexical/list` | Lexical |
| `@lexical/markdown` | Lexical |
| `@lexical/react` | Lexical |
| `@lexical/rich-text` | Lexical |
| `@lexical/selection` | Lexical |
| `@lexical/table` | Lexical |
| `@lexical/utils` | Lexical |

Peer dependencies for host apps:

- `react`
- `react-dom`

## Non-lexical dependencies in `@lyfie/luthor` (conflict focus)

These are the non-lexical packages currently present in the resolved production graph.

| Package | How it is included | Example transitive path |
| --- | --- | --- |
| `@emoji-mart/data` | Transitive-only (optional via headless) | `@lyfie/luthor -> @lyfie/luthor-headless -> @emoji-mart/data` |
| `@floating-ui/core` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @floating-ui/react -> @floating-ui/react-dom -> @floating-ui/dom -> @floating-ui/core` |
| `@floating-ui/dom` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @floating-ui/react -> @floating-ui/react-dom -> @floating-ui/dom` |
| `@floating-ui/react` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @floating-ui/react` |
| `@floating-ui/react-dom` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @floating-ui/react -> @floating-ui/react-dom` |
| `@floating-ui/utils` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @floating-ui/react -> @floating-ui/utils` |
| `@lyfie/luthor-headless` | Direct dependency | `@lyfie/luthor -> @lyfie/luthor-headless` |
| `@preact/signals-core` | Transitive-only | `@lyfie/luthor -> @lexical/link -> @lexical/extension -> @preact/signals-core` |
| `isomorphic.js` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/yjs -> yjs -> lib0 -> isomorphic.js` |
| `lib0` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/yjs -> yjs -> lib0` |
| `prismjs` | Transitive-only | `@lyfie/luthor -> @lexical/code -> prismjs` |
| `react` | Peer dependency | `@lyfie/luthor -> react` |
| `react-dom` | Peer dependency | `@lyfie/luthor -> react-dom` |
| `react-error-boundary` | Transitive-only | `@lyfie/luthor -> @lexical/react -> react-error-boundary` |
| `scheduler` | Transitive-only | `@lyfie/luthor -> react-dom -> scheduler` |
| `tabbable` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @floating-ui/react -> tabbable` |
| `yjs` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/yjs -> yjs` |

## Lexical sub-dependencies in `@lyfie/luthor`

These are all lexical-family packages currently in the resolved production graph.

| Package | How it is included | Example transitive path |
| --- | --- | --- |
| `@lexical/clipboard` | Transitive-only | `@lyfie/luthor -> @lexical/table -> @lexical/clipboard` |
| `@lexical/code` | Direct dependency | `@lyfie/luthor -> @lexical/code` |
| `@lexical/devtools-core` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/devtools-core` |
| `@lexical/dragon` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/dragon` |
| `@lexical/extension` | Transitive-only | `@lyfie/luthor -> @lexical/link -> @lexical/extension` |
| `@lexical/hashtag` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/hashtag` |
| `@lexical/history` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/history` |
| `@lexical/html` | Direct dependency | `@lyfie/luthor -> @lexical/html` |
| `@lexical/link` | Direct dependency | `@lyfie/luthor -> @lexical/link` |
| `@lexical/list` | Direct dependency | `@lyfie/luthor -> @lexical/list` |
| `@lexical/mark` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/mark` |
| `@lexical/markdown` | Direct dependency | `@lyfie/luthor -> @lexical/markdown` |
| `@lexical/offset` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/yjs -> @lexical/offset` |
| `@lexical/overflow` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/overflow` |
| `@lexical/plain-text` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/plain-text` |
| `@lexical/react` | Direct dependency | `@lyfie/luthor -> @lexical/react` |
| `@lexical/rich-text` | Direct dependency | `@lyfie/luthor -> @lexical/rich-text` |
| `@lexical/selection` | Direct dependency | `@lyfie/luthor -> @lexical/selection` |
| `@lexical/table` | Direct dependency | `@lyfie/luthor -> @lexical/table` |
| `@lexical/text` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/text` |
| `@lexical/utils` | Direct dependency | `@lyfie/luthor -> @lexical/utils` |
| `@lexical/yjs` | Transitive-only | `@lyfie/luthor -> @lexical/react -> @lexical/yjs` |
| `lexical` | Direct dependency | `@lyfie/luthor -> lexical` |

## Prism behavior confirmation

- `@lexical/code` depends on `prismjs`.
- `@lyfie/luthor` does not declare `prismjs` directly.
- Result: preset users still do not need an additional Prism install, because Prism comes transitively through `@lexical/code`.
- App-level consumers that call Prism APIs directly (for example docs code-renderers) can add `prismjs` at the app layer.

For headless setups, syntax highlighting can still be customized through `codeExtension` / `codeIntelligenceExtension`.

## Practical conflict debugging workflow

1. Run `pnpm --filter @lyfie/luthor why <package-name>` to see exact pull-in paths.
2. Check whether the package is direct, peer, or transitive-only from the tables above.
3. Resolve conflicts at the highest practical edge (usually your app lockfile or direct dependency constraints).
