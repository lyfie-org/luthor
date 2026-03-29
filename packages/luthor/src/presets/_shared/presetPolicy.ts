/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

export type ClassNameToken = string | false | null | undefined;

export type PresetFeatureOverrides<TFeature extends string> = Partial<
  Record<TFeature, boolean>
>;

/**
 * Encapsulates default + enforced feature-flag composition for preset editors.
 */
export class PresetFeaturePolicy<TFeature extends string> {
  private readonly defaults: PresetFeatureOverrides<TFeature>;
  private readonly enforced: PresetFeatureOverrides<TFeature>;

  constructor(
    defaults: PresetFeatureOverrides<TFeature>,
    enforced: PresetFeatureOverrides<TFeature> = {},
  ) {
    this.defaults = { ...defaults };
    this.enforced = { ...enforced };
  }

  resolve(
    overrides?: PresetFeatureOverrides<TFeature>,
  ): PresetFeatureOverrides<TFeature> {
    return {
      ...this.defaults,
      ...(overrides ?? {}),
      ...this.enforced,
    };
  }
}

export function joinClassNames(...tokens: readonly ClassNameToken[]): string {
  return tokens
    .filter(
      (token): token is string =>
        typeof token === "string" && token.trim().length > 0,
    )
    .join(" ");
}
