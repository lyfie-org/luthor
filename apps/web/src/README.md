# `src` structure

- `app/`: Next.js App Router entrypoints and route files.
- `components/layout/`: shared shell components used across routes.
- `config/`: app-wide constants and static metadata config.
- `features/`: domain modules grouped by responsibility:
  - `docs/`: docs data access service.
  - `editor/`: lazy-loaded editor runtime shell/client.
  - `home/`: home-page specific UI pieces.
- `utils/`: generic helpers.
- `content/docs/`: markdown content rendered under `/docs/**`.
- `data/`: generated build-time data artifacts.
