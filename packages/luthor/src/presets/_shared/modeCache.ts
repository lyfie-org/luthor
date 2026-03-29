/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { PresetModeCache } from "./types";

export function createModeCache<TMode extends string>(
  initialValidModes: readonly TMode[],
): PresetModeCache<TMode> {
  return new Set(initialValidModes);
}

export function invalidateModeCache<TMode extends string>(
  cache: PresetModeCache<TMode>,
  alwaysValidModes: readonly TMode[],
): void {
  cache.clear();
  for (const mode of alwaysValidModes) {
    cache.add(mode);
  }
}

export function isModeCached<TMode extends string>(
  cache: PresetModeCache<TMode>,
  mode: TMode,
): boolean {
  return cache.has(mode);
}

export function markModeCached<TMode extends string>(
  cache: PresetModeCache<TMode>,
  mode: TMode,
): void {
  cache.add(mode);
}
