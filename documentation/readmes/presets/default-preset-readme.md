# Default preset

Balanced general-purpose preset suitable as a baseline.

## Export

- `defaultPreset` from `@lyfie/luthor`
- Source export: `src/presets/default/index.ts`

## Preset metadata

- `id`: `default`
- `label`: `Default`
- `description`: `Balanced general purpose editor preset.`
- `css`: `default/styles.css`
- `default placeholder`: `Start writing...`

## Default toolbar

`heading`, `bold`, `italic`, `link`, `image`, `table`

## Usage

```tsx
import { defaultPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (defaultPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function DefaultEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={defaultPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


