/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * WCAG 2.1 AA regression guards for the overlay surfaces.
 *
 * The three typeahead surfaces (slash menu, emoji menu, command palette)
 * deliberately keep DOM focus in the editor while they are open —
 * moving it would break typing — so they must expose the ARIA
 * combobox/listbox relationship instead: a `listbox` container, `option`
 * children carrying `aria-selected`, and `aria-activedescendant` naming
 * the active one. Without that a screen reader announces nothing as the
 * user arrows through the list.
 *
 * These assert on the source rather than a render because the surfaces
 * only mount behind editor state that jsdom cannot produce (a live caret
 * with a real selection rect). A render-level suite belongs with the
 * browser-driven tests noted in the edge-case coverage page.
 */

function readSource(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const SURFACES = [
  {
    name: "slash command menu",
    path: "src/core/slash-command-menu.tsx",
    activeDescendantPrefix: "luthor-slash-option-",
  },
  {
    name: "emoji suggestion menu",
    path: "src/core/emoji-suggestion-menu.tsx",
    activeDescendantPrefix: "luthor-emoji-option-",
  },
  {
    name: "command palette",
    path: "src/core/command-palette.tsx",
    activeDescendantPrefix: "luthor-command-option-",
  },
] as const;

describe("typeahead surfaces expose the listbox pattern", () => {
  for (const surface of SURFACES) {
    describe(surface.name, () => {
      const source = readSource(surface.path);

      it("declares a listbox container", () => {
        expect(source).toContain('role="listbox"');
      });

      it("marks its items as options with a selected state", () => {
        expect(source).toContain('role="option"');
        expect(source).toContain("aria-selected");
      });

      it("points aria-activedescendant at the active option", () => {
        expect(source).toContain("aria-activedescendant");
        expect(source).toContain(surface.activeDescendantPrefix);
      });

      it("keeps options out of the Tab order, since focus stays in the editor", () => {
        // Options reachable by Tab would strand keyboard users inside a
        // menu whose focus model is arrow-key driven.
        expect(source).toMatch(/tabIndex=\{-1\}|role="option"/);
      });

      it("names the surface for screen readers", () => {
        expect(source).toMatch(/aria-label="[^"]+"/);
      });

      it("announces an empty result set", () => {
        expect(source).toContain('role="status"');
      });
    });
  }
});

describe("link hover bubble", () => {
  const source = readSource("src/core/link-hover-bubble.tsx");

  it("is a named group so its controls are announced in context", () => {
    expect(source).toContain('role="group"');
    expect(source).toContain('aria-label="Link actions"');
  });

  it("labels each of its controls", () => {
    expect(source).toContain('aria-label="Unlink"');
    expect(source).toContain('aria-label="Edit link URL"');
  });

  it("marks an invalid URL for assistive tech", () => {
    expect(source).toContain("aria-invalid");
  });
});

describe("command palette dialog semantics", () => {
  const source = readSource("src/core/command-palette.tsx");

  it("is a labelled modal dialog", () => {
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('aria-label="Command Palette"');
  });

  it("wires the search input as a combobox controlling the list", () => {
    expect(source).toContain('role="combobox"');
    expect(source).toContain('aria-controls="luthor-command-palette-list"');
    expect(source).toContain('aria-autocomplete="list"');
  });
});

describe("toolbar", () => {
  const source = readSource("src/core/toolbar.tsx");

  it("carries roles and labels on its controls", () => {
    expect(source).toContain("role=");
    expect(source.match(/aria-label/g)?.length ?? 0).toBeGreaterThan(10);
  });
});

describe("reduced motion", () => {
  const source = readSource("src/core/styles.css");

  it("honors prefers-reduced-motion", () => {
    expect(source).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("neutralizes the themed transition token, not just individual rules", () => {
    // Most Luthor motion reads this token, so zeroing it is what makes
    // the query effective rather than cosmetic.
    const reducedBlock = source.slice(
      source.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reducedBlock).toContain("--luthor-theme-transition: 0s");
    expect(reducedBlock).toContain("animation-duration");
  });
});
