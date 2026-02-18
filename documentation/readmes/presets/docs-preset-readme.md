# Docs preset

Preset tailored for technical documentation content.

## Export

- `docsPreset` from `@lyfie/luthor`
- Source export: `src/presets/docs/index.ts`

## Preset metadata

- `id`: `docs`
- `label`: `Docs`
- `description`: `Documentation focused with code and callouts.`
- `css`: `docs/styles.css`
- `default placeholder`: `Write documentation...`

## Default toolbar

`heading`, `bold`, `italic`, `code`, `codeBlock`, `link`

## Usage

```tsx
import { docsPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (docsPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function DocsEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={docsPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


