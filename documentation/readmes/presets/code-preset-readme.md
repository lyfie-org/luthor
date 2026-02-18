# Code preset

Developer-focused preset with code-first authoring.

## Export

- `codePreset` from `@lyfie/luthor`
- Source export: `src/presets/code/index.ts`

## Preset metadata

- `id`: `code`
- `label`: `Code`
- `description`: `Developer focused editing with code as a first class block.`
- `css`: `code/styles.css`
- `default placeholder`: `Paste or write code...`

## Default toolbar

`code`, `codeBlock`, `copy`, `link`

## Usage

```tsx
import { codePreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (codePreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function CodeEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={codePreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


