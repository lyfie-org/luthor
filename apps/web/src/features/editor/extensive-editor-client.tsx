'use client';

import { ExtensiveEditor } from '@lyfie/luthor';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const HIGHLIGHT_THEME_LINK_ID = 'luthor-highlightjs-theme';

type ExtensiveEditorClientProps = {
  siteTheme?: Theme;
};

export function ExtensiveEditorClient({ siteTheme }: ExtensiveEditorClientProps) {
  const [editorTheme, setEditorTheme] = useState<Theme>(siteTheme ?? 'light');

  useEffect(() => {
    setEditorTheme(siteTheme ?? 'light');
  }, [siteTheme]);

  useEffect(() => {
    const href =
      editorTheme === 'dark'
        ? '/highlightjs/github-dark.css'
        : '/highlightjs/github.css';

    const existing = document.getElementById(HIGHLIGHT_THEME_LINK_ID);
    const link =
      existing instanceof HTMLLinkElement
        ? existing
        : document.createElement('link');

    if (!(existing instanceof HTMLLinkElement)) {
      link.id = HIGHLIGHT_THEME_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    if (link.href !== new URL(href, window.location.origin).href) {
      link.href = href;
    }
  }, [editorTheme]);

  return (
    <ExtensiveEditor
      initialTheme={siteTheme}
      onThemeChange={setEditorTheme}
      toolbarAlignment="center"
    />
  );
}
