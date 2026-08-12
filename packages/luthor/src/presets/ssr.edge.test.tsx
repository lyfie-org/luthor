/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment node

import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ExtensiveEditor } from "./extensive";
import { MarkDownEditor } from "./md-editor";
import { HTMLEditor } from "./html-editor";
import { LegacyRichEditor } from "./legacy-rich";
import { PapyraEditor } from "./papyra";

/**
 * Next.js App Router renders on the server first, where `window` and
 * `document` do not exist. Two separate failures are possible and both
 * are covered here:
 *
 *  1. Touching the DOM at *module scope* — this whole file would fail to
 *     import, since the environment is `node` with no jsdom at all.
 *  2. Touching the DOM during *render* — caught by renderToString below.
 *
 * The presets are expected to render their server-side shell without a
 * live editor; Lexical mounts on the client. What must not happen is a
 * thrown ReferenceError that takes down the host's whole page.
 */

const PRESETS = [
  { name: "ExtensiveEditor", Component: ExtensiveEditor },
  { name: "MarkDownEditor", Component: MarkDownEditor },
  { name: "HTMLEditor", Component: HTMLEditor },
  { name: "LegacyRichEditor", Component: LegacyRichEditor },
  { name: "PapyraEditor", Component: PapyraEditor },
] as const;

describe("no preset touches the DOM at module scope", () => {
  it("imports every preset in a DOM-free environment", () => {
    // Reaching this assertion at all proves the imports above succeeded
    // with no `window`/`document` present.
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    for (const { Component } of PRESETS) {
      expect(Component).toBeDefined();
    }
  });
});

describe("server rendering", () => {
  for (const { name, Component } of PRESETS) {
    it(`renders ${name} to a string without a DOM`, () => {
      const html = renderToString(<Component showDefaultContent={false} />);
      expect(typeof html).toBe("string");
    });
  }

  it("renders a preset carrying content props without touching the DOM", () => {
    const html = renderToString(
      <MarkDownEditor
        showDefaultContent={false}
        defaultContent={"# Heading\n\nBody text"}
        placeholder="Write here"
      />,
    );
    expect(typeof html).toBe("string");
  });
});
