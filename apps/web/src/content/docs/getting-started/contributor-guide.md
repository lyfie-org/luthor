---
title: Contributor Guide
description: Monorepo architecture, local workflows, docs tooling, and contributor checklist for Luthor packages.
---

# Contributor Guide

This page is the fastest path for contributors working on `@lyfie/luthor` and `@lyfie/luthor-headless`.

## Prerequisites

- Node `>=20`
- `pnpm@10.4.1`

## Monorepo map

- `packages/headless`: headless runtime, extension system, and JSON/Markdown/HTML bridges.
- `packages/luthor`: preset package built on top of headless.
- `apps/demo`: Vite playground for rapid preset QA.
- `apps/web`: docs + marketing site (this documentation lives here).
- `tools`: release hardening, rule contracts, size checks, and workflow scripts.

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
2. Keep `title` and `description` frontmatter set.
3. Regenerate the static docs index:

```bash
pnpm -C apps/web run sync:docs
```

4. If you changed content for LLM files, run:

```bash
pnpm -C apps/web run sync:llms
```

5. Preview docs locally:

```bash
pnpm -C apps/web run dev
```

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
- Include before/after screenshots or GIFs for UX changes.
