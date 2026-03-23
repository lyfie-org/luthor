---
title: "Contributor Guide"
description: "Contributor workflow, validation checklist, and docs maintenance rules for this monorepo."
package: "contributor"
docType: "guide"
surface: "tooling"
keywords:
  - "contributing"
  - "monorepo"
  - "lint"
  - "build"
  - "tests"
  - "docs sync"
props:
  []
exports:
  []
commands:
  []
extensions:
  []
nodes:
  []
frameworks:
  []
lastVerifiedFrom:
  - "package.json"
  - "apps/web/package.json"
navGroup: "contributing"
navOrder: 10
---

# Contributor Guide

Use this checklist to keep docs and runtime contracts aligned in each pull request.

## What this page answers

- Which commands are required before merge?
- Which docs artifacts must be regenerated?

## Core workflow

~~~bash
pnpm install
pnpm lint
pnpm build
pnpm -C packages/headless test
pnpm -C packages/luthor test
~~~

## Docs workflow

~~~bash
pnpm -C apps/web run sync:docs
pnpm -C apps/web run sync:llms
~~~


