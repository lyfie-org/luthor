---
title: Installation
description: Install, update, and uninstall @lyfie/luthor and @lyfie/luthor-headless.
---

# Installation

This page covers install, update, and uninstall for both packages.

## Install @lyfie/luthor

```bash
npm install @lyfie/luthor react react-dom
```

## Install @lyfie/luthor-headless

```bash
npm install @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

Optional for headless:

```bash
npm install highlight.js @emoji-mart/data
```

## Update packages

```bash
npm update @lyfie/luthor @lyfie/luthor-headless
```

## Uninstall packages

```bash
npm uninstall @lyfie/luthor @lyfie/luthor-headless
```

If you installed headless peers directly and want to remove them too:

```bash
npm uninstall lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils highlight.js @emoji-mart/data
```

## Common mistakes

1. Missing Lexical peer dependencies for headless setup
2. Missing `@lyfie/luthor/styles.css` import for presets
3. React/Lexical version mismatch
4. Following preset docs when implementing headless UI (or vice versa)
