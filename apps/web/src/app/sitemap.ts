import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';
import { getAllDocs } from '@/features/docs/docs.service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docs = await getAllDocs();
  const staticRoutes = ['/', '/demo/', '/docs/'];
  const now = new Date();

  const baseEntries = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.8,
  }));

  const docEntries = docs.map((doc) => ({
    url: `${SITE_URL}${doc.urlPath}`,
    lastModified: new Date(doc.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...baseEntries, ...docEntries];
}
