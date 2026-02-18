# Email preset

Preset focused on email-friendly authoring and markup constraints.

## Export

- `emailPreset` from `@lyfie/luthor`
- Source export: `src/presets/email/index.ts`

## Preset metadata

- `id`: `email`
- `label`: `Email`
- `description`: `Email safe markup with stricter rules.`
- `css`: `email/styles.css`
- `default placeholder`: `Write an email...`

## Default toolbar

`bold`, `italic`, `link`, `button`, `table`

## Usage

```tsx
import { emailPreset } from "@lyfie/luthor";
import { createEditorSystem, RichText } from "@lyfie/luthor-headless";

const extensions = (emailPreset.extensions ?? []) as const;
const { Provider } = createEditorSystem<typeof extensions>();

export function EmailEditor() {
  return (
    <Provider extensions={extensions}>
      <RichText placeholder={emailPreset.config?.placeholder} />
    </Provider>
  );
}
```

## Related docs

- Package README: [../../../packages/luthor/README.md](../../../packages/luthor/README.md)
- Monorepo README: [../../../README.md](../../../README.md)
- Docs hub: [../../documentation-hub.md](../../documentation-hub.md)


