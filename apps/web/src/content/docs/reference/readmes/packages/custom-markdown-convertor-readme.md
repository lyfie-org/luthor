---
title: "Legacy Converter Note"
---

# Legacy Converter Note

This document previously described the enhanced markdown converter workflow.

## Current status

- HTML/Markdown mode-facing editor APIs are removed from active workflows.
- The recommended persistence path is now JSON/JSONB only.

## Use instead

- [../../../user/headless/import-export.md](/docs/reference/user/headless/import-export/)
- [../../../user/demo/usage-and-persistence.md](/docs/reference/user/demo/usage-and-persistence/)
- [../../../user/luthor/extensive-editor.md](/docs/reference/user/luthor/extensive-editor/)

## Migration checklist

1. Replace `getMarkdown()` / `injectMarkdown()` usage with `getJSONB()` / `injectJSONB()`.
2. Persist canonical payloads in JSONB.
3. Validate imported payload shape before restore.
