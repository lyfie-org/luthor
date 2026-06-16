/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { EditorPreset } from "..";
import { createExtensivePreset } from "../extensive";
import type { ExtensivePresetConfig } from "../extensive";
import { PapyraEditor } from "./PapyraEditor";

/**
 * Configuration accepted by {@link createPapyraPreset}. At the skeleton stage it
 * forwards the {@link ExtensivePresetConfig} knobs the underlying extensions
 * understand. Papyra-specific tuning (theme, adapter, command set) arrives in
 * later sprints (E1+).
 */
export type PapyraPresetConfig = ExtensivePresetConfig;

const PAPYRA_PRESET_LABEL = "Papyra Editor";
const PAPYRA_PRESET_DESCRIPTION =
  "Markdown-native, frontmatter-agnostic note canvas for Papyra.";

/**
 * Build the `papyra` preset, composed on top of the extensive preset. The
 * shared registry entry below is `createPapyraPreset()` with defaults.
 */
export function createPapyraPreset(
  config: PapyraPresetConfig = {},
): EditorPreset {
  return {
    ...createExtensivePreset(config),
    id: "papyra",
    label: PAPYRA_PRESET_LABEL,
    description: PAPYRA_PRESET_DESCRIPTION,
    components: {
      Editor: PapyraEditor,
    },
    css: "papyra/papyra.css",
  };
}

export const papyraPreset: EditorPreset = createPapyraPreset();
