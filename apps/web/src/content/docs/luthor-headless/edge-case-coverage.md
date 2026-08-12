---
title: "Edge Case Coverage"
description: "What Luthor is tested against for IME, bidi, Unicode, paste, scale, history, SSR, and StrictMode — and the gaps that cannot be covered in jsdom."
package: "headless"
docType: "reference"
surface: "tooling"
keywords:
  - "IME composition"
  - "RTL"
  - "bidi"
  - "unicode"
  - "grapheme"
  - "SSR"
  - "StrictMode"
  - "edge cases"
props:
  []
exports:
  []
commands:
  []
extensions:
  []
nodes:
  []
frameworks:
  - "next"
lastVerifiedFrom:
  - "packages/headless/src/edge-cases"
  - "packages/luthor/src/presets/ssr.edge.test.tsx"
  - "packages/luthor/src/presets/strict-mode.edge.test.tsx"
navGroup: "luthor_headless"
navOrder: 46
---

# Edge Case Coverage

Luthor is used in documents its authors never see: Japanese notes, Arabic
articles, pastes out of Word, files with 10,000 blocks. This page records
what is tested, what the tests found, and — as honestly — what cannot be
tested in the jsdom environment the suites run in.

## What this page answers

- Which hostile or unusual inputs are covered by tests?
- What did those tests establish about real behavior?
- Which risks are known but unverified, and why?

## Covered

| Area | What is asserted |
|---|---|
| **IME composition** | Block-anchor auto-stamping stands down while `isComposing()` and resumes after. Driven through Lexical's `$setCompositionKey`, so removing the guard fails the test. |
| **Bidi / RTL** | Arabic and Hebrew round-trip verbatim through markdown and HTML, including mixed LTR/RTL paragraphs, RTL headings and lists, and idempotency on a second pass. |
| **Unicode** | ZWJ family emoji, skin-tone modifiers, regional-indicator flags, stacked combining marks, Devanagari clusters, and astral-plane codepoints survive both bridges byte-exactly, including across formatting boundaries. |
| **Real-world paste** | Word, Google Docs, Sheets, VS Code, Apple Notes, and a plain article selection keep their structure and formatting through the sanitizer. |
| **Scale** | 10k-block markdown, a 100k-character paragraph, 100-deep nested lists, a 50-column table, and 5k-block HTML all convert well inside budget; a growth-ratio test guards against an accidental quadratic. |
| **History** | 100-edit undo/redo chains round-trip exactly; undoing past the start keeps the earliest state instead of emptying the document; a wholesale replacement is one undo; auto-stamped anchors fold into the triggering edit rather than becoming separately undoable. |
| **SSR** | All five presets import and `renderToString` in a DOM-free Node environment. |
| **StrictMode** | Double-mount and ten mount/unmount cycles leak no `MutationObserver`, interval, or `document`/`window` listener. |
| **Concurrent input** | 200 edits queued in one tick keep every character and their order; a bulk insertion between keystrokes does not drop them; a programmatic replacement wins cleanly without splicing pending edits into the adopted document. |

## Measured numbers

Recorded so a future regression reads as a multiple rather than noise
(local run, jsdom):

| Operation | Time |
|---|---|
| 10,000-block markdown parse + serialize | ~390 ms |
| 5,000-block HTML sanitize + convert | ~600 ms |
| 100-edit undo + redo chain | ~2.5 s (dominated by per-commit flushes) |

## Known gaps

These are documented rather than silently skipped.

### The DOM watchdog's observer path

`registerEditorDomWatchdog` reports only after a settle window
(`MutationObserver` → `setTimeout`). Lexical's own mutation handling
restores an externally written DOM back to the model within roughly 2 ms,
so by the time the window closes there is no divergence left to observe —
verified directly: divergence is present synchronously after an external
write and `null` 2 ms later.

The detection function (`detectEditorDomDivergence`) is covered. The
`isComposing()` early-return inside the watchdog's settle callback is
reviewed but not asserted; exercising it needs a real browser.

### Direction is not stored in the model

Lexical 0.40 does not persist a per-block `direction`. It emits
`dir="auto"` and lets the browser's bidi algorithm resolve each block,
which handles mixed runs better than a stored guess would.

The consequence for hosts: bridge JSON carries `direction: null`. A host
rendering that JSON through its own renderer must emit `dir="auto"`
itself, or RTL content will lay out left-to-right. This is asserted in
the suite so the behavior is visible if a future Lexical changes it.

### `blob:` URL lifecycle under StrictMode

`ImageComponent` revokes a `blob:` src in its unmount cleanup, with
nothing distinguishing a StrictMode teardown from a real one — so the
throwaway first mount can revoke a URL the surviving mount still needs.
The extensive preset's default `uploadHandler` returns
`URL.createObjectURL(file)`, so the shipped default is what hits this.

Attempts to reproduce it in jsdom were **unsuccessful**: decorator nodes
inserted programmatically did not mount an `<img>` in the test
environment, so any assertion would have passed vacuously. The risk is
recorded from code inspection, not from a reproduction. Production hosts
should return a persistent URL from their upload handler.

### Not covered here

Caret movement, selection geometry, and composition *keystroke* handling
depend on real layout and native IME events. jsdom has neither. These
need a browser-driven suite (Playwright or similar) to cover properly.
