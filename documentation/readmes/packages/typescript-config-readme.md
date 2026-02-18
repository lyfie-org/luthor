# @repo/typescript-config

Shared TypeScript config presets used across the monorepo.

## Available Configs

- `base.json`: strict baseline for TypeScript projects
- `nextjs.json`: Next.js-focused config
- `react-library.json`: library-oriented React config

## Usage

In a package `tsconfig.json`:

```json
{
	"extends": "@repo/typescript-config/base.json"
}
```

## Related Docs

- Monorepo overview: [../../../README.md](../../../README.md)
- Documentation hub: [../../documentation-hub.md](../../documentation-hub.md)


