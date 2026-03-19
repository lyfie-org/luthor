'use client';

import { ExtensiveEditor } from '@lyfie/luthor';
import { useEffect, useState } from 'react';
import { HOME_EXTENSIVE_SHORT_CONTENT } from './demo-content';
import {
  syncHighlightThemeStylesheet,
  type EditorTheme,
} from './highlight-theme';

type ExtensiveEditorClientProps = {
  siteTheme?: EditorTheme;
};

export function ExtensiveEditorClient({ siteTheme }: ExtensiveEditorClientProps) {
  const [editorTheme, setEditorTheme] = useState<EditorTheme>(siteTheme ?? 'light');

  useEffect(() => {
    setEditorTheme(siteTheme ?? 'light');
  }, [siteTheme]);

  useEffect(() => {
    syncHighlightThemeStylesheet(editorTheme, { source: 'public' });
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
