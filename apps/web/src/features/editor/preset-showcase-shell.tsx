'use client';

import dynamic from 'next/dynamic';

const PresetShowcase = dynamic(
  () => import('./preset-showcase-client').then((module) => module.PresetShowcaseClient),
  {
    ssr: false,
    loading: () => <p className="editor-loading">Loading preset gallery...</p>,
  },
);

export function PresetShowcaseShell() {
  return <PresetShowcase />;
}

