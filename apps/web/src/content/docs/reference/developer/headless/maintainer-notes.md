---
title: "Headless Maintainer Notes (Developer)"
---

# Headless Maintainer Notes (Developer)

## Performance

- Keep extension command creation pure and avoid unnecessary re-instantiation.
- Prefer targeted state queries over broad recomputation on every update.
- For heavy UI overlays (tables, draggable handles, floating toolbars), keep DOM reads/writes minimal and batched.
- Load optional dependencies lazily where practical (example: language detection paths).

## Troubleshooting checklist

- Verify extension array contents and order.
- Ensure extension array is declared `as const`.
- Confirm all peer dependencies are installed and version-compatible.
- Check that a feature’s node registrations and plugin renderers are both active.
- Confirm import/export extension inclusion when commands appear missing.

## Dependency policy

- Keep this package lightweight and headless-first.
- Any non-essential integration should be optional and fail-safe.
- Lexical-derived feature implementations belong in `packages/headless`; preset package re-exports and composes.

## Testing and validation expectations

For any source change in `packages/headless`:

1. `pnpm --filter @lyfie/luthor-headless lint`
2. `pnpm --filter @lyfie/luthor-headless build`
3. `pnpm build` from repo root when change spans package boundaries

## Documentation upkeep

- Update [source-file-reference.md](/docs/reference/developer/headless/source-file-reference/) when source files move or behavior changes.
- Keep user-facing guides in `documentation/user/headless/*` aligned with exported API reality.
- Keep mandatory READMEs in sync with docs hub links.
