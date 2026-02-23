'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(
  () => import('./extensive-editor-client').then((module) => module.ExtensiveEditorClient),
  {
    ssr: false,
    loading: () => <p className="editor-loading">Loading editor runtime...</p>,
  },
);

export function ExtensiveEditorShell() {
  return <Editor />;
}
