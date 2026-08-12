---
title: "Accessibility"
description: "Luthor's WCAG 2.1 AA posture: keyboard operation, screen-reader semantics, focus handling, reduced motion, and the gaps that remain."
package: "luthor"
docType: "reference"
surface: "preset"
keywords:
  - "accessibility"
  - "a11y"
  - "WCAG"
  - "keyboard navigation"
  - "screen reader"
  - "aria-activedescendant"
  - "prefers-reduced-motion"
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
  []
lastVerifiedFrom:
  - "packages/luthor/src/core/toolbar.tsx"
  - "packages/luthor/src/core/slash-command-menu.tsx"
  - "packages/luthor/src/core/emoji-suggestion-menu.tsx"
  - "packages/luthor/src/core/command-palette.tsx"
  - "packages/luthor/src/core/link-hover-bubble.tsx"
  - "packages/luthor/src/core/styles.css"
navGroup: "luthor"
navOrder: 95
---

# Accessibility

Luthor targets **WCAG 2.1 Level AA**. This page records what is
implemented and verified, so hosts can cite it in their own
accessibility statements — and what is not, so nobody cites something
that isn't true.

## What this page answers

- Can every feature be operated from the keyboard?
- What do screen readers announce for the overlay surfaces?
- How is motion handled, and what remains unverified?

## Keyboard operation

| Surface | Keys |
|---|---|
| Editor | Standard text editing. `Tab` inserts indentation inside lists and code; press `Escape` first to move focus out of the editor instead. |
| Toolbar | `Tab` to reach it, arrow keys within grouped controls, `Enter`/`Space` to activate. |
| Slash menu (`/`) | `↑`/`↓` to move, `Enter` to insert, `Escape` to dismiss. Focus stays in the editor. |
| Emoji menu (`:`) | Same as the slash menu. |
| Command palette | `Escape` to dismiss, `↑`/`↓` to move, `Enter` to run. Focus is in the search input. |
| Link bubble | Reachable by `Tab`; `Escape` returns to the editor. |

### The Tab trap, and how to escape it

A rich-text editor that swallows `Tab` traps keyboard users. Luthor's
`TabIndentExtension` takes `Tab` for indentation, but pressing `Escape`
first releases it: the next `Tab` then moves focus out of the editor
normally. Every other focus-capturing surface follows the same rule —
`Escape` always returns control to the caret.

## Screen-reader semantics

The three typeahead surfaces deliberately **keep DOM focus in the
editor** while open, because moving focus would interrupt typing. They
therefore expose the ARIA combobox/listbox relationship instead:

- the container is a `role="listbox"` with an `aria-label`,
- each item is a `role="option"` carrying `aria-selected`,
- `aria-activedescendant` on the container (or, for the palette, on its
  search input) names the active option, so arrowing through the list is
  announced without focus moving,
- items are `tabIndex={-1}`, keeping them out of the Tab order,
- an empty result set is announced through `role="status"`.

The command palette is additionally a `role="dialog"` with
`aria-modal="true"`, and its input is a `role="combobox"` wired to the
list via `aria-controls`. The link bubble is a labelled `role="group"`
so its controls are announced in context, and its URL field sets
`aria-invalid` when the value is rejected.

Purely decorative chrome — menu headers, group titles that duplicate an
`aria-label`, emoji glyphs beside their own text label — is marked
`aria-hidden` so it is not read twice.

## Motion

Luthor honors `prefers-reduced-motion: reduce`. Most of its motion flows
through the `--luthor-theme-transition` token, which the query sets to
`0s`; animations and transitions that do not read the token are reduced
to a negligible duration by the same block. Hosts overriding Luthor's
CSS should keep that media query in place.

## Verified by tests

`packages/luthor/src/core/accessibility.test.tsx` guards the semantics
above: listbox/option roles, `aria-selected`, `aria-activedescendant`
wiring per surface, dialog and combobox attributes on the palette,
labelled link-bubble controls, and the reduced-motion block including
its token reset.

## Known gaps

These are honest limits, not oversights to be discovered later.

### Not verified automatically

- **Colour contrast.** The default light and dark palettes were chosen
  for AA contrast but there is no automated contrast check in CI. A host
  overriding the theme tokens owns contrast for its own palette.
- **Focus-visible styling** across every control in both themes.
- **Focus restoration** after a menu or dialog closes is driven by
  keeping focus in the editor rather than by explicitly restoring it.
  That is correct for the typeahead surfaces; it has not been audited
  for every dialog.

### Not testable in the current suite

The a11y tests assert on component source, not on rendered output,
because the overlay surfaces only mount behind editor state that jsdom
cannot produce (a live caret with a real selection rectangle). A
render-level audit — and any real screen-reader verification with
NVDA, JAWS, or VoiceOver — needs a browser-driven suite. Until that
exists, treat this page as describing implemented semantics rather than
observed assistive-technology behaviour.
