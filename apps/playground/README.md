# Playground

Standalone Vite playground for `@lyfie/luthor`, modeled after `apps/demo`.

This project intentionally uses npm and the published package from npm registry:

- `@lyfie/luthor` (public package)
- no `workspace:*` dependencies
- locked npm resolution (`package-lock.json`) for reproducible playground behavior

## Scripts

- `npm install`
- `npm run dev`
- `npm start` (StackBlitz-friendly dev command)
- `npm run build`
- `npm run preview`
- `npm run verify:online` (creates an isolated temp project, runs `npm ci` + build, and verifies registry-resolved `@lyfie/luthor`)
