# CMS preset

Structured-content preset designed for CMS workflows.

## Export

- `cmsPreset` from `@lyfie/luthor`
- Source export: `src/presets/cms/index.ts`

## Preset metadata

- `id`: `cms`
- `label`: `CMS`
- `description`: `Structured content with validation and schema rules.`
- `css`: `cms/styles.css`
- `default placeholder`: `Compose structured content...`

## Default toolbar

`heading`, `bold`, `italic`, `link`, `image`

## Usage

```tsx
import { cmsPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (cmsPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function CmsEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={cmsPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../README.md](../../../README.md)
- Monorepo README: [../../../../../README.md](../../../../../README.md)
- Docs hub: [../../../../../documentation/README.md](../../../../../documentation/README.md)