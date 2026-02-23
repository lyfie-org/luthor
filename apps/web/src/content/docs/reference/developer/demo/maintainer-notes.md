---
title: "Demo Maintainer Notes"
---

# Demo Maintainer Notes

Maintainer notes for contributors working on `apps/demo`.

## Scope boundaries

- The demo should exercise public package APIs (`@lyfie/luthor`, `@lyfie/luthor-headless`), not private internals.
- Keep demo behavior representative of real-world integration scenarios.

## Key integration invariants

- `ExtensiveEditorRef` methods are the central bridge for content operations.
- Demo content constants in `src/data/demoContent.ts` should remain the single source for seeded examples.
- Theme and persistence status UX should remain explicit and easy to inspect.

## Persistence behavior assumptions

- Theme uses local storage.
- JSONB/markdown payload handling is user-triggered from the persistence panel.
- Restore logic should fail safely on malformed JSON and provide status feedback.

## Deployment notes

- Deploy script uses Wrangler after app build.
- Worker entry remains `src/index.ts`; update docs/config together if this changes.

## Validation checklist

From repo root:

- `pnpm --filter demo lint`
- `pnpm --filter demo build`
- if package interfaces changed, also run `pnpm build`

## Documentation upkeep

- Update [source-file-reference.md](/docs/reference/developer/demo/source-file-reference/) when files move or change responsibilities.
- Keep user guide aligned with scripts and package versions.
- Keep docs index links synchronized in `documentation/index.md` and `documentation/documentation-hub.md`.
