---
title: "Demo App Getting Started (`apps/demo`)"
---

# Demo App Getting Started (`apps/demo`)

This guide is for users and contributors who want to run the demo app locally and validate editor features.

## What the demo provides

The demo showcases:

- `@lyfie/luthor` extensive preset integration
- feature coverage visualization of installed extensions
- visual/JSONB persistence round-trip controls
- theme switching and copy/export helper actions

## Versions and dependencies

From `apps/demo/package.json`:

- app version: `0.0.0` (private workspace app)
- React: `^19.2.0`
- React DOM: `^19.2.0`
- workspace packages: `@lyfie/luthor`, `@lyfie/luthor-headless`
- Vite: `^7.3.1`
- TypeScript: `~5.9.3`
- Wrangler: `^4.66.0`

## Run locally

From repository root:

```bash
pnpm --filter demo dev
```

Or from `apps/demo`:

```bash
pnpm dev
```

## Build and preview

```bash
pnpm --filter demo build
pnpm --filter demo preview
```

## Lint

```bash
pnpm --filter demo lint
```

## Deploy (Cloudflare Worker)

```bash
pnpm --filter demo deploy
```

This runs build then `wrangler deploy`. Ensure Cloudflare auth and Wrangler environment are configured.

## Feature walkthrough

1. Load seeded JSONB content from top bar action.
2. Explore feature coverage groups rendered from extension metadata.
3. Save JSONB payload from persistence panel.
4. Modify/copy payload and restore content to test round-trip behavior.

## Related docs

- Demo user behavior details: [usage-and-persistence.md](/docs/reference/user/demo/usage-and-persistence/)
- Demo developer architecture: [../../developer/demo/architecture.md](/docs/reference/developer/demo/architecture/)
- Demo source map: [../../developer/demo/source-file-reference.md](/docs/reference/developer/demo/source-file-reference/)
