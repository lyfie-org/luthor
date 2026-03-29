/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';
import { getAllDocs } from '@/features/docs/docs.service';

type SitemapEntry = MetadataRoute.Sitemap[number];

function toCanonicalUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, SITE_URL).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docs = await getAllDocs();
  const staticRoutes = ['/', '/demo/', '/docs/getting-started/'];
  const now = new Date();

  const baseEntries: SitemapEntry[] = staticRoutes.map((route) => ({
    url: toCanonicalUrl(route),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.8,
  }));

  const docEntries: SitemapEntry[] = docs.map((doc) => ({
    url: toCanonicalUrl(doc.urlPath),
    lastModified: Number.isNaN(new Date(doc.updatedAt).getTime()) ? now : new Date(doc.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  const deduped = new Map<string, SitemapEntry>();
  for (const entry of [...baseEntries, ...docEntries]) {
    deduped.set(entry.url, entry);
  }

  return [...deduped.values()].sort((a, b) => a.url.localeCompare(b.url));
}
