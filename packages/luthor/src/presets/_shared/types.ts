/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { DefaultSettings, ToolbarItemType, ToolbarVisibility } from "../../core";

export type PresetModeCache<TMode extends string> = Set<TMode>;

export type FeatureFlagsLike<TFeature extends string = string> = Record<TFeature, boolean>;

export type FeatureShortcutSpec<TFeature extends string = string> = {
  feature: TFeature;
  key: string;
  requiresPrimary: boolean;
  shift?: boolean;
  alt?: boolean;
};

export type ToolbarFeatureMap<TFeature extends string = string> = Partial<
  Record<ToolbarItemType, TFeature | readonly TFeature[]>
>;

export type StyleVarRecord = Record<string, string>;

export type StyleVarValueRecord = Record<string, string | undefined>;

export type { DefaultSettings, ToolbarVisibility };
