# Minimal preset

Lightweight preset for short content and simple formatting.

## Export

- `minimalPreset` from `@lyfie/luthor`
- Source export: `src/presets/minimal/index.ts`

## Preset metadata

- `id`: `minimal`
- `label`: `Minimal`
- `description`: `Lightweight editor for short text and embeds.`
- `css`: `minimal/styles.css`
- `default placeholder`: `Write something...`

## Default toolbar

`bold`, `italic`, `link`

## Usage

```tsx
import { minimalPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (minimalPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function MinimalEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={minimalPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


