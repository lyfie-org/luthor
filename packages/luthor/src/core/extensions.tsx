/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { createElement, useSyncExternalStore, type ComponentType } from "react";
import { FloatingToolbarExtension } from "@lyfie/luthor-headless";
import { FloatingToolbar } from "./floating-toolbar";
import type { CoreEditorActiveStates, CoreEditorCommands, CoreTheme } from "./types";

type FloatingToolbarContext = {
  commands: CoreEditorCommands;
  activeStates: CoreEditorActiveStates;
  editorTheme: CoreTheme;
  isFeatureEnabled: (feature: string) => boolean;
};

/**
 * What the floating toolbar renders from — one per editor, and reactive: a new
 * value re-renders the bar immediately. (It used to be a single module-level
 * object shared by every editor on the page, read when the toolbar happened to
 * re-render — so the bar could show one editor's commands in another, or a
 * previous selection's active states until the next selection event.)
 */
export interface FloatingToolbarContextStore {
  get(): FloatingToolbarContext;
  set(next: FloatingToolbarContext): void;
  subscribe(listener: () => void): () => void;
}

function createStore(initial: FloatingToolbarContext | null, fallback?: FloatingToolbarContextStore): FloatingToolbarContextStore {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value ?? fallback?.get() ?? DEFAULT_CONTEXT,
    set: (next) => {
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      const unsubscribeFallback = fallback?.subscribe(listener);
      return () => {
        listeners.delete(listener);
        unsubscribeFallback?.();
      };
    },
  };
}

const DEFAULT_CONTEXT: FloatingToolbarContext = {
  commands: {} as CoreEditorCommands,
  activeStates: {},
  editorTheme: "light",
  isFeatureEnabled: () => true,
};

// Kept for hosts that drive the toolbar through the legacy global setter.
const globalStore = createStore(null);

/**
 * Legacy global context. Editors built by the presets now carry their own store
 * (see {@link getFloatingToolbarContextStore}); this remains the fallback for a
 * toolbar extension whose own store was never filled.
 */
export function setFloatingToolbarContext(
  commands: CoreEditorCommands,
  activeStates: CoreEditorActiveStates,
  editorTheme: CoreTheme,
  isFeatureEnabled: (feature: string) => boolean = () => true,
) {
  globalStore.set({ commands, activeStates, editorTheme, isFeatureEnabled });
}

const STORE = Symbol.for("luthor.floatingToolbarContextStore");

/** The context store of a toolbar extension made by {@link createFloatingToolbarExtension}. */
export function getFloatingToolbarContextStore(extension: unknown): FloatingToolbarContextStore | null {
  return (extension as { [STORE]?: FloatingToolbarContextStore } | null)?.[STORE] ?? null;
}

type ViewProps = { toolbarProps: Record<string, unknown>; store: FloatingToolbarContextStore };

function FloatingToolbarContextView({ toolbarProps, store }: ViewProps) {
  const context = useSyncExternalStore(store.subscribe, store.get, store.get);
  const View = FloatingToolbar as unknown as ComponentType<Record<string, unknown>>;
  return createElement(View, {
    ...toolbarProps,
    commands: context.commands,
    activeStates: context.activeStates,
    editorTheme: context.editorTheme,
    isFeatureEnabled: context.isFeatureEnabled,
  });
}

/** A floating-toolbar extension with its own reactive context store. */
export function createFloatingToolbarExtension() {
  const store = createStore(null, globalStore);
  const floatingToolbarExtension = new FloatingToolbarExtension();
  (floatingToolbarExtension as any).config = {
    ...(floatingToolbarExtension as any).config,
    render: (props: unknown) =>
      createElement(FloatingToolbarContextView, { toolbarProps: props as Record<string, unknown>, store }),
    getCommands: () => store.get().commands,
    getActiveStates: () => store.get().activeStates,
  };
  (floatingToolbarExtension as unknown as { [STORE]: FloatingToolbarContextStore })[STORE] = store;
  return floatingToolbarExtension;
}
