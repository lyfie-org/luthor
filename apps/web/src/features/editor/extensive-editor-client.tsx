/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

'use client';

import { ExtensiveEditor } from '@lyfie/luthor';
import { HOME_EXTENSIVE_SHORT_CONTENT } from './demo-content';

type Theme = 'light' | 'dark';

type ExtensiveEditorClientProps = {
  siteTheme?: Theme;
};

export function ExtensiveEditorClient({ siteTheme }: ExtensiveEditorClientProps) {
  return (
    <ExtensiveEditor
      initialTheme={siteTheme}
      showDefaultContent={false}
      defaultContent={HOME_EXTENSIVE_SHORT_CONTENT}
      toolbarAlignment="center"
      isToolbarPinned={true}
    />
  );
}
