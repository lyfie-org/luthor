/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it, vi } from "vitest";
import {
  createFloatingToolbarExtension,
  getFloatingToolbarContextStore,
  setFloatingToolbarContext,
} from "./extensions";
import type { CoreEditorCommands } from "./types";

const commands = (name: string) => ({ name } as unknown as CoreEditorCommands);

describe("floating toolbar context", () => {
  it("each editor's toolbar has its own context — two editors never cross-wire", () => {
    const a = createFloatingToolbarExtension();
    const b = createFloatingToolbarExtension();
    const storeA = getFloatingToolbarContextStore(a)!;
    const storeB = getFloatingToolbarContextStore(b)!;
    storeA.set({ commands: commands("a"), activeStates: { bold: true }, editorTheme: "light", isFeatureEnabled: () => true });
    storeB.set({ commands: commands("b"), activeStates: {}, editorTheme: "dark", isFeatureEnabled: () => true });

    const config = (ext: unknown) =>
      (ext as { config: { getCommands: () => unknown; getActiveStates: () => unknown } }).config;
    expect(config(a).getCommands()).toEqual({ name: "a" });
    expect(config(b).getCommands()).toEqual({ name: "b" });
    expect(config(a).getActiveStates()).toEqual({ bold: true });
    expect(config(b).getActiveStates()).toEqual({});
  });

  it("notifies subscribers when its context changes (the bar re-renders at once)", () => {
    const store = getFloatingToolbarContextStore(createFloatingToolbarExtension())!;
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set({ commands: commands("x"), activeStates: {}, editorTheme: "light", isFeatureEnabled: () => true });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set({ commands: commands("y"), activeStates: {}, editorTheme: "light", isFeatureEnabled: () => true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("falls back to the legacy global context until its own is set", () => {
    const store = getFloatingToolbarContextStore(createFloatingToolbarExtension())!;
    setFloatingToolbarContext(commands("global"), {}, "light");
    expect(store.get().commands).toEqual({ name: "global" });
    store.set({ commands: commands("own"), activeStates: {}, editorTheme: "light", isFeatureEnabled: () => true });
    expect(store.get().commands).toEqual({ name: "own" });
  });
});
