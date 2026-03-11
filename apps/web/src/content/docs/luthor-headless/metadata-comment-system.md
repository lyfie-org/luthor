---
title: Metadata Comment System
description: How luthor metadata envelopes preserve unsupported and non-native data across JSON, Markdown, and HTML bridges.
---

# Metadata Comment System

When converting between editor JSON and Markdown or HTML, not every node or field can be represented natively.  
`@lyfie/luthor-headless` preserves that data using metadata envelopes encoded as HTML comments.

## Envelope format

Comments are appended to source output:

```html
<!-- luthor:meta v1 {"id":"featureCard:1:1","type":"featureCard","path":[1],"node":{"type":"featureCard","version":1,"payload":{"title":"AI Draft"}},"fallback":"[Unsupported featureCard preserved in markdown metadata]"} -->
```

Source implementation:

- `packages/headless/src/core/metadata-envelope.ts`

## Export pipeline (`jsonToMarkdown` and `jsonToHTML`)

1. `prepareDocumentForBridge(...)` sanitizes the JSON for source-safe conversion.
2. Unsupported node types are replaced with fallback text and stored in envelopes.
3. Supported nodes with non-native fields generate patch envelopes.
4. The converter builds markdown or html from sanitized JSON.
5. `appendMetadataEnvelopes(...)` appends envelopes as `<!-- luthor:meta v1 ... -->`.

## Import pipeline (`markdownToJSON` and `htmlToJSON`)

1. `extractMetadataEnvelopes(...)` strips and parses envelope comments.
2. Markdown or HTML content is converted to base JSON.
3. `rehydrateDocumentFromEnvelopes(...)` restores preserved data.

## Why two restoration strategies exist

- `replace`: for unsupported node types. The original node is restored by path.
- `merge`: for supported node types where extra metadata must be patched back onto native fields.

## Markdown-specific behavior

`markdown.ts` intentionally keeps markdown-editable fields native (for example image alt text and embed captions) while storing non-native extras in merge envelopes. This supports manual markdown edits without losing richer metadata.

Legacy comments are still supported for backwards compatibility:

- `<!-- luthor:iframe {...} -->`
- `<!-- luthor:youtube {...} -->`

## Safety guarantees

- Unknown envelope versions are ignored with warnings.
- Malformed JSON payloads are ignored safely.
- Envelopes missing required fields are ignored.
- Import continues with valid content even when some envelopes are invalid.

## Contributor rules

- If you add a new node type with non-native fields, update supported-type sets and patch extraction logic in both `markdown.ts` and `html.ts`.
- Keep `ENVELOPE_VERSION` stable unless the format truly changes.
- Add round-trip tests in `packages/headless/src/core/metadata-envelope.test.ts`, `packages/headless/src/core/markdown.test.ts`, and `packages/headless/src/core/html.test.ts`.

## Debugging checklist

1. Export JSON to markdown or html and confirm `luthor:meta v1` comments appear when expected.
2. Edit source manually and re-import.
3. Verify metadata fields survive round-trip.
4. Check console warnings for ignored or malformed envelopes.

## Preset impact

`LegacyRichEditor`, `MDEditor`, `HTMLEditor`, and `HeadlessEditorPreset` in `@lyfie/luthor` disable many metadata-heavy features by default to keep source workflows predictable.
