# `src` structure

- `app/`: Next.js App Router entrypoints and route files.
- `components/layout/`: shared shell components used across routes.
- `config/`: app-wide constants and static metadata config.
- `features/`: domain modules grouped by responsibility:
  - `docs/`: docs search and docs data access UI.
  - `editor/`: lazy-loaded editor runtime shell/client.
  - `home/`: home-page specific UI pieces.
- `utils/`: generic helpers.
- `content/docs/`: markdown source rendered under `/docs/**`.
- `data/`: generated build-time artifacts (for example `docs-index.generated.ts`).

## Docs pipeline

1. Edit markdown in `content/docs/`.
2. Run `pnpm -C apps/web run sync:docs`.
3. Run `pnpm -C apps/web run sync:llms`.
4. Verify locally with `pnpm -C apps/web run dev`.
