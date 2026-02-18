# Chat preset

Compact composer preset optimized for chat and messaging UX.

## Export

- `chatPreset` from `@lyfie/luthor`
- Source export: `src/presets/chat/index.ts`

## Preset metadata

- `id`: `chat`
- `label`: `Chat`
- `description`: `Compact composer with mentions and quick formatting.`
- `css`: `chat/styles.css`
- `default placeholder`: `Write a message...`

## Default toolbar

`bold`, `italic`, `link`, `emoji`, `mention`

## Usage

```tsx
import { chatPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (chatPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function ChatComposer() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={chatPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


