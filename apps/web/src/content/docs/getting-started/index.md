---
title: Introduction
description: What @lyfie/luthor and @lyfie/luthor-headless are, and when to use each package.
---

# Introduction

`@lyfie/luthor` and `@lyfie/luthor-headless` solve different needs.

## @lyfie/luthor

Use this when you want a production-ready editor quickly.

- Includes preset editors and prebuilt UI
- Includes `@lyfie/luthor-headless` under the hood
- Best for fast shipping with strong defaults

## @lyfie/luthor-headless

Use this when you want full control over UI and behavior.

- Extension-first architecture
- Bring your own toolbar and app UX
- Best for custom product-specific editing flows

## Compatibility

Based on package metadata in `packages/luthor/package.json` and `packages/headless/package.json`:

- React: `^18.0.0 || ^19.0.0`
- React DOM: `^18.0.0 || ^19.0.0`
- TypeScript/TSX: fully supported
- Lexical:
  - `@lyfie/luthor`: uses Lexical `^0.40.0` dependencies internally
  - `@lyfie/luthor-headless`: peer dependency `>=0.40.0` for `lexical` and required `@lexical/*` packages

## Recommended path

1. [Introduction](/docs/getting-started/)
2. [Installation](/docs/getting-started/installation/)
3. [Contributor Guide](/docs/getting-started/contributor-guide/)
4. [Capabilities](/docs/getting-started/capabilities/)
5. [@lyfie/luthor-headless](/docs/getting-started/luthor-headless/)
6. [@lyfie/luthor](/docs/getting-started/luthor/)

## Contributor deep dives

- [@lyfie/luthor architecture](/docs/luthor/architecture/)
- [@lyfie/luthor props reference](/docs/luthor/props-reference/)
- [@lyfie/luthor feature flags](/docs/luthor/feature-flags/)
- [@lyfie/luthor-headless architecture](/docs/luthor-headless/architecture/)
- [@lyfie/luthor-headless extensions and API](/docs/luthor-headless/extensions-and-api/)
- [Metadata comment system](/docs/luthor-headless/metadata-comment-system/)
