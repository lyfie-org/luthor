---
title: "Dependencies"
description: "Dependency contract for presets and headless runtime, including optional dependencies and peer expectations."
package: "shared"
docType: "concept"
surface: "tooling"
keywords:
  - "dependency graph"
  - "peer dependencies"
  - "optionalDependencies"
  - "lexical"
props:
  []
exports:
  - "@lyfie/luthor"
  - "@lyfie/luthor-headless"
commands:
  []
extensions:
  - "emojiExtension"
nodes:
  []
frameworks:
  []
lastVerifiedFrom:
  - "packages/luthor/package.json"
  - "packages/headless/package.json"
navGroup: "start_here"
navOrder: 30
---

# Dependencies

This page explains runtime contracts so installs stay predictable.

## What this page answers

- Which package carries runtime dependencies?
- Which package keeps dependencies as peers?
- What is optional and safe to skip?

## Contract summary

| Package | Dependency model |
| --- | --- |
| `@lyfie/luthor` | Plug-and-play package with direct runtime dependencies, including `@lyfie/luthor-headless`. |
| `@lyfie/luthor-headless` | No required runtime dependencies in `dependencies`; Lexical and React are peers. |

## Optional dependency behavior

- `@lyfie/luthor-headless` keeps `@emoji-mart/data` optional.
- Features continue to work when optional packages are absent, with graceful fallbacks.


