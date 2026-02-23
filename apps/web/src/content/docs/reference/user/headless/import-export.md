---
title: "Import and Export (User)"
---

# Import and Export (User)

`@lyfie/luthor-headless` now uses a JSON/JSONB-first import/export model.

## Recommended storage strategy

Store canonical editor state as JSON (or JSONB in PostgreSQL):

- Canonical: Lexical JSON for exact fidelity
- Persistence: JSONB payloads for reversible edits and reliable restores

## Runtime API shape

The editor runtime context exposes:

- `export.toJSON()`
- `import.fromJSON(value)`

These APIs are lossless for supported nodes and extension state.

## Practical guidance

- Treat JSON/JSONB as the only source of truth.
- Validate untrusted JSON before calling `fromJSON`.
- Keep schema version metadata in your persistence envelope if your app evolves custom nodes over time.

## Example persistence envelope

```json
{
	"schemaVersion": 1,
	"preset": "extensive",
	"savedAt": "2026-02-20T00:00:00.000Z",
	"content": {
		"jsonb": "{ ...lexical state... }"
	}
}
```
