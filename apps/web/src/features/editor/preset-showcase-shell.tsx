/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

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

