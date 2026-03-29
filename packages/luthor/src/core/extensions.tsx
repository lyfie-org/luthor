/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { createElement, type ComponentType } from "react";
import { FloatingToolbarExtension } from "@lyfie/luthor-headless";
import { FloatingToolbar } from "./floating-toolbar";
import type { CoreEditorActiveStates, CoreEditorCommands, CoreTheme } from "./types";

type FloatingToolbarContext = {
  commands: CoreEditorCommands;
  activeStates: CoreEditorActiveStates;
  editorTheme: CoreTheme;
  isFeatureEnabled: (feature: string) => boolean;
};

const floatingToolbarContext: FloatingToolbarContext = {
  commands: {} as CoreEditorCommands,
  activeStates: {},
  editorTheme: "light",
  isFeatureEnabled: () => true,
};

export function setFloatingToolbarContext(
  commands: CoreEditorCommands,
  activeStates: CoreEditorActiveStates,
  editorTheme: CoreTheme,
  isFeatureEnabled: (feature: string) => boolean = () => true,
) {
  floatingToolbarContext.commands = commands;
  floatingToolbarContext.activeStates = activeStates;
  floatingToolbarContext.editorTheme = editorTheme;
  floatingToolbarContext.isFeatureEnabled = isFeatureEnabled;
}

export function createFloatingToolbarExtension() {
  const FloatingToolbarView = FloatingToolbar as unknown as ComponentType<Record<string, unknown>>;
  const floatingToolbarExtension = new FloatingToolbarExtension();
  (floatingToolbarExtension as any).config = {
    ...(floatingToolbarExtension as any).config,
    render: (props: unknown) => createElement(FloatingToolbarView, {
      ...(props as Record<string, unknown>),
      commands: floatingToolbarContext.commands,
      activeStates: floatingToolbarContext.activeStates,
      editorTheme: floatingToolbarContext.editorTheme,
      isFeatureEnabled: floatingToolbarContext.isFeatureEnabled,
    }),
    getCommands: () => floatingToolbarContext.commands,
    getActiveStates: () => floatingToolbarContext.activeStates,
  };
  return floatingToolbarExtension;
}
