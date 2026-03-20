'use client';

import { ExtensiveEditor } from '@lyfie/luthor';
import { useEffect, useState } from 'react';
import { HOME_EXTENSIVE_SHORT_CONTENT } from './demo-content';

type Theme = 'light' | 'dark';
const PRISM_THEME_LINK_ID = 'luthor-prism-theme';

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
        ? '/prismjs/themes/prism-okaidia.css'
        : '/prismjs/themes/prism.css';

    const existing = document.getElementById(PRISM_THEME_LINK_ID);
    const link =
      existing instanceof HTMLLinkElement
        ? existing
        : document.createElement('link');

    if (!(existing instanceof HTMLLinkElement)) {
      link.id = PRISM_THEME_LINK_ID;
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
      showDefaultContent={false}
      defaultContent={HOME_EXTENSIVE_SHORT_CONTENT}
      toolbarAlignment="center"
      isToolbarPinned={true}
    />
  );
}
