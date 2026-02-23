---
title: "Luthor Maintainer Notes"
---

# [Luthor](/demo/) Maintainer Notes

Maintainer-focused notes for `@lyfie/luthor` contributors.

## Ownership boundaries

- New Lexical-derived feature implementations should live in `@lyfie/luthor-headless` first.
- `@lyfie/luthor` should compose and re-export headless capabilities through preset UX.
- Avoid introducing direct, preset-only Lexical logic unless it is strictly UI composition glue.

## Core invariants

- `core/types.ts` is the contract between extension capability and UI components.
- `core/commands.ts` is the canonical command metadata source for keyboard, palette, and slash command consistency.
- `presets/extensive/extensions.tsx` is the single source for extensive preset extension stack defaults.
- `presets/extensive/ExtensiveEditor.tsx` is the runtime integration shell and should remain compositional.

## Extension composition guidance

When adding capabilities to the extensive preset:

1. Add/extend the headless extension first (if capability is missing).
2. Wire extension config in `presets/extensive/extensions.tsx`.
3. Update toolbar controls in `core/toolbar.tsx` only when UX needs new actions.
4. If command palette/slash exposure is needed, update `core/commands.ts`.
5. Update docs:
   - `documentation/developer/luthor/source-file-reference.md`
   - `documentation/user/luthor/presets-and-configuration.md`
   - package README files if public API changes.

## Known implementation trade-offs

- Some extension configuration is currently mutated via casts (`as any`) for flexibility.
- Browser APIs (`document`, `window`, `URL.createObjectURL`) are used in UI modules; SSR consumers require guards.
- Global keyboard listeners can conflict with host-app shortcuts if not scoped.
- Source-mode transitions intentionally block on invalid user source input.

## Release checklist for luthor package

- Build and lint pass from workspace root:
  - `pnpm --filter @lyfie/luthor build`
  - `pnpm --filter @lyfie/luthor lint`
- Validate preset docs and README links.
- Ensure any new exported APIs are listed in:
  - `packages/luthor/README.md`
  - `documentation/developer/luthor/source-file-reference.md`

## Related

- Architecture: [architecture.md](/docs/reference/developer/luthor/architecture/)
- Source file reference: [source-file-reference.md](/docs/reference/developer/luthor/source-file-reference/)
- Extensive preset user guide: [../../user/luthor/extensive-editor.md](/docs/reference/user/luthor/extensive-editor/)
