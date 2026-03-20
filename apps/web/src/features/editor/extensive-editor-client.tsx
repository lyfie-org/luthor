'use client';

import { ExtensiveEditor } from '@lyfie/luthor';
import { useEffect, useState } from 'react';
import { HOME_EXTENSIVE_SHORT_CONTENT } from './demo-content';
import { syncPrismTheme } from '@/utils/prism-client';

type Theme = 'light' | 'dark';

type ExtensiveEditorClientProps = {
  siteTheme?: Theme;
};

export function ExtensiveEditorClient({ siteTheme }: ExtensiveEditorClientProps) {
  const [editorTheme, setEditorTheme] = useState<Theme>(siteTheme ?? 'light');

  useEffect(() => {
    setEditorTheme(siteTheme ?? 'light');
  }, [siteTheme]);

  useEffect(() => {
    syncPrismTheme(editorTheme);
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
