---
title: Installation
description: Install, update, and uninstall @lyfie/luthor and @lyfie/luthor-headless.
---

# Installation

This page covers install, update, uninstall, and validation for both packages.

## Prerequisites

- Node.js `>=20`
- A React app using React `18` or `19`

## Install @lyfie/luthor

### npm

```bash
npm install @lyfie/luthor react react-dom
```

### pnpm

```bash
pnpm add @lyfie/luthor react react-dom
```

### yarn

```bash
yarn add @lyfie/luthor react react-dom
```

### bun

```bash
bun add @lyfie/luthor react react-dom
```

## Install @lyfie/luthor-headless

### npm

```bash
npm install @lyfie/luthor-headless lexical @lexical/code @lexical/link @lexical/list @lexical/markdown @lexical/react @lexical/rich-text @lexical/selection @lexical/table @lexical/utils react react-dom
```

### Optional dependencies for headless

```bash
npm install highlight.js @emoji-mart/data
```

`highlight.js` is optional but useful when code highlighting is enabled.  
`@emoji-mart/data` is optional and used by richer emoji catalogs.

## Verify your install

For `@lyfie/luthor`:

1. Import `@lyfie/luthor/styles.css`.
2. Render `<ExtensiveEditor />`.
3. Confirm you can type, format text, and switch view tabs.

For `@lyfie/luthor-headless`:

1. Create `extensions` and mount `<Provider extensions={extensions}>`.
2. Render `<RichText />`.
3. Confirm your custom toolbar calls extension commands correctly.

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

1. Missing Lexical peer dependencies for headless setup.
2. Missing `@lyfie/luthor/styles.css` import when using presets.
3. Mixing preset docs (`@lyfie/luthor`) with headless implementation code.
4. React/Lexical version mismatch in lockfile.
5. Forgetting to reinstall after switching package managers.

## Next steps

- If you picked presets: continue to [@lyfie/luthor](/docs/getting-started/luthor/).
- If you picked headless: continue to [@lyfie/luthor-headless](/docs/getting-started/luthor-headless/).
