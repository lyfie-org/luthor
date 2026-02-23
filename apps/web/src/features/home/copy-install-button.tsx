'use client';

import { useState } from 'react';

const INSTALL_COMMAND = 'npm install @lyfie/luthor react react-dom';

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
