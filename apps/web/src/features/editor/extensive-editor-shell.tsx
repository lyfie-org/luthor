/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Editor = dynamic(
  () => import('./extensive-editor-client').then((module) => module.ExtensiveEditorClient),
  {
    ssr: false,
    loading: () => <p className="editor-loading">Loading editor runtime...</p>,
  },
);

type Theme = 'light' | 'dark';

type ExtensiveEditorShellProps = {
  syncWithSiteTheme?: boolean;
};

function resolveTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ExtensiveEditorShell({ syncWithSiteTheme = false }: ExtensiveEditorShellProps) {
  const [siteTheme, setSiteTheme] = useState<Theme>('light');

  useEffect(() => {
    if (!syncWithSiteTheme) {
      return;
    }

    setSiteTheme(resolveTheme());

    const observer = new MutationObserver(() => {
      setSiteTheme(resolveTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [syncWithSiteTheme]);

  return <Editor siteTheme={syncWithSiteTheme ? siteTheme : undefined} />;
}
