# Markdown preset

Markdown-first authoring preset with predictable output.

## Export

- `markdownPreset` from `@lyfie/luthor`
- Source export: `src/presets/markdown/index.ts`

## Preset metadata

- `id`: `markdown`
- `label`: `Markdown`
- `description`: `Markdown first editing with predictable output.`
- `css`: `markdown/styles.css`
- `default placeholder`: `Write in markdown...`

## Default toolbar

`bold`, `italic`, `link`, `code`, `codeBlock`

## Usage

```tsx
import { markdownPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (markdownPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function MarkdownEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={markdownPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


