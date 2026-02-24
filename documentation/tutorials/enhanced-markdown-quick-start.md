# JSON Persistence Quick Start (Replaces Legacy Enhanced Markdown Tutorial)

This path now uses Visual/JSON-only workflows.

## Current recommendation

- Use `editor.getJSON()` to serialize state.
- Use `editor.injectJSON(payload)` to restore state.
- Treat JSON as canonical persistence format.

## Minimal example

```tsx
const handleSave = () => {
  const payload = editorRef.current?.getJSON();
  if (!payload) return;
  localStorage.setItem("editor-json", payload);
};

const handleRestore = () => {
  const payload = localStorage.getItem("editor-json");
  if (!payload) return;
  editorRef.current?.injectJSON(payload);
};
```

## Why this changed

Legacy HTML/Markdown mode and enhanced-markdown converter guidance has been retired from active workflows.
Use JSON for deterministic round-trips and production persistence.

## Related docs

- Import/export: [../user/headless/import-export.md](../user/headless/import-export.md)
- Demo usage: [../user/demo/usage-and-persistence.md](../user/demo/usage-and-persistence.md)
- Luthor extensive editor: [../user/luthor/extensive-editor.md](../user/luthor/extensive-editor.md)


