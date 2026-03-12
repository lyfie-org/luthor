---
title: Introduction
description: What @lyfie/luthor and @lyfie/luthor-headless are, and when to use each package.
---

# Introduction

Luthor has two packages, and each one solves a different problem:

## @lyfie/luthor

Use this when you want a production-ready editor fast.

- Ships with prebuilt editor presets and UI.
- Includes `@lyfie/luthor-headless` internally.
- Best when you want to ship quickly with solid defaults.

## @lyfie/luthor-headless

Use this when you want full control over UI and behavior.

- Extension-first architecture.
- Bring your own toolbar and app UX.
- Best for custom product-specific editor experiences.

## Compatibility

Current compatibility in this repository:

- React: `^18.0.0 || ^19.0.0`
- React DOM: `^18.0.0 || ^19.0.0`
- TypeScript/TSX: fully supported
- Lexical:
  - `@lyfie/luthor` uses Lexical `^0.40.0` dependencies internally.
  - `@lyfie/luthor-headless` requires `lexical` and `@lexical/*` peers at `>=0.40.0`.
- Optional:
  - `highlight.js >=11.0.0` (optional peer for richer code highlighting).
  - `@emoji-mart/data` (optional dependency used by emoji workflows).

## Choose the right package quickly

| Need | Best package |
| --- | --- |
| "I want a polished editor now." | `@lyfie/luthor` |
| "I want full control over toolbar, behavior, and UI." | `@lyfie/luthor-headless` |
| "I want both: ship now, customize later." | Start with `@lyfie/luthor`, then move specific flows to headless as needed. |

## AI agents and vibe coding

Luthor ships machine-readable docs artifacts:

- `/llms.txt` for lightweight indexing and discovery.
- `/llms-full.txt` for the full documentation corpus.

If you use AI coding agents, load one of these files into agent context first, then ask implementation questions against your codebase. See the full walkthrough: [AI Agents and Vibe Coding](/docs/getting-started/ai-agents-and-vibe-coding/).

## Recommended path

1. [Introduction](/docs/getting-started/)
2. [Installation](/docs/getting-started/installation/)
3. [Contributor Guide](/docs/getting-started/contributor-guide/)
4. [AI Agents and Vibe Coding](/docs/getting-started/ai-agents-and-vibe-coding/)
5. [Capabilities](/docs/getting-started/capabilities/)
6. [@lyfie/luthor-headless](/docs/getting-started/luthor-headless/)
7. [@lyfie/luthor](/docs/getting-started/luthor/)

## Contributor deep dives

- [@lyfie/luthor architecture](/docs/luthor/architecture/)
- [@lyfie/luthor props reference](/docs/luthor/props-reference/)
- [@lyfie/luthor feature flags](/docs/luthor/feature-flags/)
- [@lyfie/luthor-headless architecture](/docs/luthor-headless/architecture/)
- [@lyfie/luthor-headless extensions and API](/docs/luthor-headless/extensions-and-api/)
- [Metadata comment system](/docs/luthor-headless/metadata-comment-system/)
