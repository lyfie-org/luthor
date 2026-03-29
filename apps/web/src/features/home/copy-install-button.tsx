/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

'use client';

import { useState } from 'react';
import { INSTALL_COMMAND } from '@/config/site';


export function CopyInstallButton() {
  const [label, setLabel] = useState('Copy Install Command');

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setLabel('Copied');
    } catch {
      setLabel('Copy failed');
    } finally {
      window.setTimeout(() => setLabel('Copy Install Command'), 1500);
    }
  }

  return (
    <button className="copy-btn" type="button" onClick={onCopy}>
      {label}
    </button>
  );
}
