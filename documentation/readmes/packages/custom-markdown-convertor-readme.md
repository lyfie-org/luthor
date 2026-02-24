# Legacy Converter Note

This document previously described the enhanced markdown converter workflow.

## Current status

- HTML/Markdown mode-facing editor APIs are removed from active workflows.
- The recommended persistence path is now JSON only.

## Use instead

- [../../../user/headless/import-export.md](../../../user/headless/import-export.md)
- [../../../user/demo/usage-and-persistence.md](../../../user/demo/usage-and-persistence.md)
- [../../../user/luthor/extensive-editor.md](../../../user/luthor/extensive-editor.md)

## Migration checklist

1. Replace `getMarkdown()` / `injectMarkdown()` usage with `getJSON()` / `injectJSON()`.
2. Persist canonical payloads in JSON.
3. Validate imported payload shape before restore.


