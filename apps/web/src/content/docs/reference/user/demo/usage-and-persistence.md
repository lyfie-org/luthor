---
title: "Demo Usage and Persistence Guide"
---

# Demo Usage and Persistence Guide

This page explains the interactive flows available in `apps/demo`.

## Content loading

- The top bar provides a "Load Demo Content" action.
- This injects prepared JSONB content from `src/data/demoContent.ts` into the editor.

## Feature coverage panel

- The app groups extension names into functional categories.
- Categories and ordering are defined in `src/data/demoContent.ts`.
- Use this panel to verify whether expected capabilities are present in the active extension bundle.

## Persistence panel workflow

The panel supports three common flows:

1. **Save payload**
   - captures current editor state (JSONB-oriented payload)
   - writes payload into textarea for inspection/copy
2. **Restore payload**
   - parses textarea JSON and injects back into editor
   - reports errors if JSON is malformed
3. **Copy payload**
   - copies payload text to clipboard for bug reports or test fixtures

## Data fidelity expectations

- JSONB payload is the fidelity-first path.
- Restore behavior uses JSONB document content as the canonical source.

## Theme behavior

- Theme toggle switches between light and dark display modes.
- Theme preference is stored in local storage and restored on reload.

## Troubleshooting tips

- If restore fails, validate payload JSON format before retrying.
- Clipboard actions may require secure context/permissions.
- If seeded content does not appear, verify editor mount is ready and load action was triggered.

## Related docs

- Demo getting started: [getting-started.md](/docs/reference/user/demo/getting-started/)
- Demo maintainer notes: [../../developer/demo/maintainer-notes.md](/docs/reference/developer/demo/maintainer-notes/)
