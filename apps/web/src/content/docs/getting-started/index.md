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

## @lyfie/headless

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
3. [@lyfie/headless](/docs/getting-started/luthor-headless/)
4. [@lyfie/luthor](/docs/getting-started/luthor/)
