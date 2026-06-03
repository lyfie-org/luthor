/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

'use client';

import { useEffect, useState } from 'react';
import { DownloadSimple, Package } from '@phosphor-icons/react/dist/ssr';
import { formatCompact } from '@/utils/format';

// Mirrors MetricsApiResponse from the API route — kept local to avoid pulling
// server-only imports (next/server) into the client bundle.
type MetricsApiResponse = {
  totalDownloads: number | null;
  lastMonthDownloads: number | null;
  latestVersion: string | null;
  headlessVersion: string | null;
  luthorPackageSize: number | null;
  headlessPackageSize: number | null;
  releaseCount: number | null;
  fetchedAtIso: string | null;
};

export type LiveStatValues = {
  totalDownloads: string;
  latestVersion: string;
};

type LiveStatsProps = {
  /** Build-time formatted values rendered immediately on SSR.
   *  Silently replaced once the CDN-cached /api/metrics response arrives. */
  initial: LiveStatValues;
  /** Static link badges rendered alongside the live stat badges. */
  children?: React.ReactNode;
};

/**
 * Renders the stats badge row, starting from baked-in build-time values and
 * refreshing from a single /api/metrics fetch after mount.
 *
 * Loaded via next/dynamic so webpack handles it as a lazy client boundary
 * (same pattern as WhyLuthorFeatures). The route carries s-maxage=3600, so
 * Cloudflare CDN serves cached JSON from the edge — the Worker is invoked at
 * most once per PoP per hour regardless of traffic. Version and download counts
 * are derived from registry blobs: zero extra network requests.
 */
export function LiveStats({ initial, children }: LiveStatsProps) {
  const [values, setValues] = useState<LiveStatValues>(initial);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/metrics')
      .then((res) => (res.ok ? (res.json() as Promise<MetricsApiResponse>) : null))
      .then((data) => {
        if (cancelled || !data) return;

        setValues((prev) => {
          const totalDownloads = formatCompact(data.totalDownloads);
          const latestVersion  = data.latestVersion ?? prev.latestVersion;

          return {
            totalDownloads: totalDownloads !== 'N/A' ? totalDownloads : prev.totalDownloads,
            latestVersion:  latestVersion  !== 'N/A' ? latestVersion  : prev.latestVersion,
          };
        });
      })
      .catch(() => {
        // keep build-time values on network error
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stats-badge-row">
      <article className="metric metric-badge">
        <p className="metric-label">
          <DownloadSimple size={14} weight="duotone" aria-hidden="true" />
          <span>Total downloads</span>
        </p>
        <p className="metric-value">{values.totalDownloads}</p>
      </article>
      <article className="metric metric-badge">
        <p className="metric-label">
          <Package size={14} weight="duotone" aria-hidden="true" />
          <span>Latest version</span>
        </p>
        <p className="metric-value">{values.latestVersion}</p>
      </article>
      {children}
    </div>
  );
}
