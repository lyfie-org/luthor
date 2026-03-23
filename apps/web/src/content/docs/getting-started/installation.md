---
title: "Installation"
description: "Install @lyfie/luthor or @lyfie/luthor-headless with minimal setup commands and CSS notes."
package: "shared"
docType: "guide"
surface: "tooling"
keywords:
  - "installation"
  - "pnpm"
  - "npm"
  - "yarn"
  - "bun"
  - "css import"
props:
  []
exports:
  - "ExtensiveEditor"
  - "createEditorSystem"
commands:
  []
extensions:
  []
nodes:
  []
frameworks:
  - "react"
  - "nextjs"
  - "astro"
  - "remix"
  - "vite"
lastVerifiedFrom:
  - "packages/luthor/package.json"
  - "packages/headless/package.json"
  - "packages/luthor/src/index.ts"
navGroup: "start_here"
navOrder: 20
---

# Installation

Install only the package that matches your delivery model.

## What this page answers

- Which package do I install?
- Do I need to import CSS?
- What is the minimum command set?

## Install presets package

~~~bash
pnpm add @lyfie/luthor
~~~

`@lyfie/luthor` includes preset editors and bundled styles.

## Install headless runtime

~~~bash
pnpm add @lyfie/luthor-headless lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/table @lexical/markdown @lexical/html @lexical/selection @lexical/utils
~~~

`@lyfie/luthor-headless` keeps dependencies as peer contracts so your app controls versions.

## CSS note

- Preset users import package CSS once in app entry.
- Headless users own all UI and CSS.


