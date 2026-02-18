# Blog preset

Long-form publishing preset for article-style content.

## Export

- `blogPreset` from `@lyfie/luthor`
- Source export: `src/presets/blog/index.ts`

## Preset metadata

- `id`: `blog`
- `label`: `Blog`
- `description`: `Long form publishing with media and quotes.`
- `css`: `blog/styles.css`
- `default placeholder`: `Tell your story...`

## Default toolbar

`heading`, `bold`, `italic`, `link`, `image`, `blockquote`, `bulletedList`, `numberedList`

## Usage

```tsx
import { blogPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (blogPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function BlogEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={blogPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


