# Import and Export (User)

`@lyfie/luthor-headless` supports JSON, HTML, and Markdown flows through extension commands and utility converters.

## Recommended storage strategy

Store both:

- Canonical: Lexical JSON (highest fidelity)
- Interop: HTML or enhanced Markdown (for external channels/search/audit)

## HTML flow

- `htmlExtension` exposes export/import commands.
- Enhanced HTML helpers can embed and recover `LUTHOR_STATE` metadata for better round trips.

Use cases:

- Share content to systems expecting HTML.
- Recover near-full editor state when metadata is preserved.

## Markdown flow

- `markdownExtension` handles markdown import/export via lexical transformers.
- Enhanced markdown helpers embed metadata comments in the form:

```md
<!-- LUTHOR_BLOCK {"type":"image","payload":{...}} -->
```

Use cases:

- Human-readable storage with richer node reconstruction.
- Easier diffing and code-review of content changes.

## Utility APIs

Exported from package utils:

- Enhanced HTML helpers from `EnhancedHTMLConvertor`
- Enhanced markdown helpers from `EnhancedMarkdownConvertor`

These APIs are useful when you need explicit metadata parsing/stripping behavior outside editor commands.

## Practical guidance

- If exact fidelity is mandatory, rely on JSON as source of truth.
- If markdown comments may be stripped by external processors, keep JSON fallback.
- Validate import content before injecting untrusted HTML/URLs.
