---
title: "Project Deliverables Summary"
---

# Project Deliverables Summary

## Current editor delivery status

The active editor workflow is now Visual + JSONB.

### Delivered

- JSONB-first persistence and restoration in demo and extensive preset flows.
- Visual/JSONB mode switching with validation safeguards.
- Headless core import/export contracts simplified to JSON-only APIs.
- Removal of HTML/Markdown mode-facing APIs and stale extension wiring.
- Documentation alignment across user and developer guides.

### Canonical persistence strategy

```json
{
  "schemaVersion": 1,
  "content": {
    "jsonb": "{ ...lexical state... }"
  }
}
```

### Notes

Historical enhanced-markdown and HTML conversion guidance is archived and no longer the recommended implementation path.
