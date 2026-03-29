/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

'use client';

import { useMemo } from 'react';

type LocalLastSyncProps = {
  isoTimestamp: string | null;
};

export function LocalLastSync({ isoTimestamp }: LocalLastSyncProps) {
  const label = useMemo(() => {
    if (!isoTimestamp) return 'N/A';
    const date = new Date(isoTimestamp);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  }, [isoTimestamp]);

  return <>{label}</>;
}

