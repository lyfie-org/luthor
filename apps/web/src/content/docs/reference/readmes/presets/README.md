---
title: "Presets Documentation"
---

# Presets Documentation

The active preset surface in `@lyfie/luthor` is currently centered on the Extensive Editor:

- [extensive-preset-readme.md](/docs/reference/readmes/presets/extensive-preset-readme/)

## Why only one preset right now

The current phase focuses on making the extensive baseline rock-solid and complete before splitting into multiple style-specific presets.

## Future preset expansion guidelines

When adding a new preset in future iterations:

1. Reuse shared modules from `packages/luthor/src/core`.
2. Compose from `extensiveExtensions` selectively, or build an explicit extension list from headless exports.
3. Keep preset-specific behavior in `packages/luthor/src/presets/<preset-name>`.
4. Export through `packages/luthor/src/presets/index.ts` and update `presetRegistry`.
5. Add or update docs in this folder and link them from:
   - `documentation/documentation-hub.md`
   - `documentation/developer_notes/readme-map.md`
   - `documentation/markdown-catalog.md`

This keeps the package clean today while preserving a predictable path for future preset families.
