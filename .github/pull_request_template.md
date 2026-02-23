## Summary

- What changed:
- Why:

## Rules Checklist (Preset_Rules)

- [ ] Read relevant docs before implementation (`documentation/**`).
- [ ] Verified existing code patterns before adding new logic.
- [ ] Kept Lexical-derived behavior in `@lyfie/luthor-headless`.
- [ ] Kept preset/UI composition changes in `@lyfie/luthor`.
- [ ] Optional integrations are metadata-declared and fail-safe.
- [ ] Updated README/docs for any public API/config behavior changes.
- [ ] Maintained clean folder/module boundaries.

## Validation

- [ ] `pnpm check:rule-contracts`
- [ ] `pnpm --filter @lyfie/luthor-headless lint`
- [ ] `pnpm --filter @lyfie/luthor-headless test`
- [ ] `pnpm --filter @lyfie/luthor-headless build`
- [ ] `pnpm --filter @lyfie/luthor lint`
- [ ] `pnpm --filter @lyfie/luthor test`
- [ ] `pnpm --filter @lyfie/luthor build`

## Release Hardening (when packaging changed)

- [ ] `pnpm --filter @lyfie/luthor-headless pack`
- [ ] `pnpm --filter @lyfie/luthor pack`
- [ ] Consumer smoke check passed against packed tarballs.
