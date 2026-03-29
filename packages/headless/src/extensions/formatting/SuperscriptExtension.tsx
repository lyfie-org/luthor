/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { TextFormatExtension } from "@lyfie/luthor-headless/extensions/base";

export class SuperscriptExtension extends TextFormatExtension<"superscript"> {
  constructor() {
    super("superscript");
  }
}

export const superscriptExtension = new SuperscriptExtension();
