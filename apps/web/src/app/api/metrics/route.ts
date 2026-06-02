/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { NextResponse } from 'next/server';

// Fetched on demand, not at build time. Cloudflare CDN caches this response
// for 1 hour via s-maxage, so the Worker is only invoked on the first request
// per edge PoP per cache TTL — effectively free on the free tier.
export const dynamic = 'force-dynamic';

const PRIMARY_PACKAGE = '@lyfie/luthor';
const HEADLESS_PACKAGE = '@lyfie/luthor-headless';
const CACHE_MAX_AGE = 60 * 60; // 1 hour

// stale-while-revalidate: serve cached response while refreshing in background.
// Version/size/releases change only on publish — stale data is acceptable.
const CACHE_HEADERS = {
  'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 24}`,
} as const;

const FETCH_TIMEOUT_MS = 5000;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

async function getDownloadPoint(range: string, pkg: string): Promise<number | null> {
  const encoded = encodeURIComponent(pkg);
  const data = (await fetchJson(`https://api.npmjs.org/downloads/point/${range}/${encoded}`)) as Record<
    string,
    unknown
  > | null;
  return numberOrNull(data?.downloads);
}

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

export async function GET(): Promise<NextResponse> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Both registry blobs are fetched regardless — download counts need the
    // created dates from them, so version/size/release data comes for free.
    const [luthorReg, headlessReg] = (await Promise.all([
      fetchJson(`https://registry.npmjs.org/${encodeURIComponent(PRIMARY_PACKAGE)}`),
      fetchJson(`https://registry.npmjs.org/${encodeURIComponent(HEADLESS_PACKAGE)}`),
    ])) as [Record<string, unknown> | null, Record<string, unknown> | null];

    const luthorCreated = toIsoDate((luthorReg?.time as Record<string, unknown> | undefined)?.created);
    const headlessCreated = toIsoDate((headlessReg?.time as Record<string, unknown> | undefined)?.created);

    const [luthorTotal, headlessTotal, luthorMonth, headlessMonth] = await Promise.all([
      luthorCreated ? getDownloadPoint(`${luthorCreated}:${today}`, PRIMARY_PACKAGE) : null,
      headlessCreated ? getDownloadPoint(`${headlessCreated}:${today}`, HEADLESS_PACKAGE) : null,
      getDownloadPoint('last-month', PRIMARY_PACKAGE),
      getDownloadPoint('last-month', HEADLESS_PACKAGE),
    ]);

    const totalDownloads =
      typeof luthorTotal === 'number' || typeof headlessTotal === 'number'
        ? (luthorTotal ?? 0) + (headlessTotal ?? 0)
        : null;

    const lastMonthDownloads =
      typeof luthorMonth === 'number' || typeof headlessMonth === 'number'
        ? (luthorMonth ?? 0) + (headlessMonth ?? 0)
        : null;

    // Extracted from already-fetched registry data — zero extra network calls.
    const latestVersion = stringOrNull(
      (luthorReg?.['dist-tags'] as Record<string, unknown> | undefined)?.latest,
    );
    const headlessVersion = stringOrNull(
      (headlessReg?.['dist-tags'] as Record<string, unknown> | undefined)?.latest,
    );
    const luthorPackageSize =
      latestVersion !== null
        ? numberOrNull(
            (
              (luthorReg?.versions as Record<string, unknown> | undefined)?.[latestVersion] as
                | Record<string, unknown>
                | undefined
            )?.dist &&
              (
                (
                  (luthorReg?.versions as Record<string, unknown> | undefined)?.[latestVersion] as Record<
                    string,
                    unknown
                  >
                )?.dist as Record<string, unknown>
              )?.unpackedSize,
          )
        : null;
    const headlessPackageSize =
      headlessVersion !== null
        ? numberOrNull(
            (
              (headlessReg?.versions as Record<string, unknown> | undefined)?.[headlessVersion] as
                | Record<string, unknown>
                | undefined
            )?.dist &&
              (
                (
                  (headlessReg?.versions as Record<string, unknown> | undefined)?.[headlessVersion] as Record<
                    string,
                    unknown
                  >
                )?.dist as Record<string, unknown>
              )?.unpackedSize,
          )
        : null;

    const luthorReleaseCount = luthorReg?.versions
      ? Object.keys(luthorReg.versions as Record<string, unknown>).length
      : 0;
    const headlessReleaseCount = headlessReg?.versions
      ? Object.keys(headlessReg.versions as Record<string, unknown>).length
      : 0;
    const releaseCount =
      luthorReleaseCount > 0 || headlessReleaseCount > 0 ? luthorReleaseCount + headlessReleaseCount : null;

    const payload: MetricsApiResponse = {
      totalDownloads,
      lastMonthDownloads,
      latestVersion,
      headlessVersion,
      luthorPackageSize,
      headlessPackageSize,
      releaseCount,
      fetchedAtIso: new Date().toISOString(),
    };

    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch {
    const fallback: MetricsApiResponse = {
      totalDownloads: null,
      lastMonthDownloads: null,
      latestVersion: null,
      headlessVersion: null,
      luthorPackageSize: null,
      headlessPackageSize: null,
      releaseCount: null,
      fetchedAtIso: null,
    };
    return NextResponse.json(fallback, { status: 500 });
  }
}
