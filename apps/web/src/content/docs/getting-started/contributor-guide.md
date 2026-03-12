---
title: Contributor Guide
description: Monorepo architecture, local workflows, docs tooling, and contributor checklist for Luthor packages.
---

# Contributor Guide

This is the fastest path for contributors working on `@lyfie/luthor` and `@lyfie/luthor-headless`.

## Prerequisites

- Node `>=20`
- `pnpm@10.4.1`

## Monorepo map

- `packages/headless`: headless runtime, extension system, conversion bridges, theme utilities.
- `packages/luthor`: preset package built on top of headless.
- `apps/demo`: Vite playground for preset behavior QA.
- `apps/web`: docs + marketing site. All docs pages live here.
- `tools`: release hardening, contracts, size checks, and CI support scripts.

## Local development commands

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm build
pnpm lint
pnpm check:rule-contracts
pnpm size:check
pnpm check:release-hardening
```

Package-level tests:

```bash
pnpm -C packages/headless test
pnpm -C packages/luthor test
```

## Docs workflow (`apps/web`)

1. Add or edit markdown files in `apps/web/src/content/docs/**`.
2. Keep `title` and `description` frontmatter current and accurate.
3. Regenerate the static docs index:

```bash
pnpm -C apps/web run sync:docs
```

4. Regenerate LLM artifacts:

```bash
pnpm -C apps/web run sync:llms
```

5. Validate docs locally:

```bash
pnpm -C apps/web run dev
```

## Docs quality bar

- Explain features in plain English first, then show APIs.
- Include every relevant prop/method/feature flag in reference pages.
- Keep examples practical and copy-paste friendly.
- Keep docs and runtime behavior aligned. If behavior changes, docs must change in the same PR.

## Where to start by topic

- Preset behavior and UI composition: [/docs/luthor/architecture/](/docs/luthor/architecture/)
- Preset props and feature gates: [/docs/luthor/props-reference/](/docs/luthor/props-reference/)
- Headless runtime and extension API: [/docs/luthor-headless/architecture/](/docs/luthor-headless/architecture/)
- Metadata comment bridge internals: [/docs/luthor-headless/metadata-comment-system/](/docs/luthor-headless/metadata-comment-system/)

## Pull request checklist

- Reproduce in `apps/demo` or `apps/web/demo` if UI-related.
- Add or update tests in touched package when behavior changes.
- Run `pnpm lint` and impacted package tests.
- Run `pnpm -C apps/web run sync:docs` if docs changed.
- Run `pnpm -C apps/web run sync:llms` when docs content changes.
- Include before/after screenshots or GIFs for UX changes.
