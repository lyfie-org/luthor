# Classic preset

Traditional full-featured WYSIWYG-style editor preset.

## Export

- `classicPreset` from `@lyfie/luthor`
- Source export: `src/presets/classic/index.ts`

## Preset metadata

- `id`: `classic`
- `label`: `Classic`
- `description`: `Full featured WYSIWYG default.`
- `css`: `classic/styles.css`
- `default placeholder`: `Start writing...`

## Default toolbar

`undo`, `redo`, `bold`, `italic`, `underline`, `link`, `image`, `table`, `bulletedList`, `numberedList`

## Usage

```tsx
import { classicPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (classicPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function ClassicEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={classicPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


