# Core + Preset System Map

This page is retained for compatibility. The canonical, up-to-date architecture docs are:

- [../../../developer/luthor/architecture.md](../../../developer/luthor/architecture.md)
- [../../../developer/luthor/source-file-reference.md](../../../developer/luthor/source-file-reference.md)

## Quick summary

- `packages/luthor/src/core/*` contains reusable preset UI and command adapters.
- `packages/luthor/src/presets/extensive/*` composes the extensive preset and runtime editor shell.
- `packages/luthor/src/index.ts` exports preset APIs, core utilities, and `headless` namespace passthrough.

For file-by-file responsibilities across all 21 source files, use the canonical source reference above.
