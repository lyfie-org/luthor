import { SITE_URL } from '@/config/site';

const SITE_ORIGIN = new URL(SITE_URL).origin;
const WEBSITE_PROTOCOLS = new Set(['http:', 'https:']);

function parseHref(href: string): URL | null {
  try {
    return new URL(href, SITE_URL);
  } catch {
    return null;
  }
}

export function isExternalWebsiteHref(href: string): boolean {
  const parsed = parseHref(href);
  if (!parsed) return false;
  if (!WEBSITE_PROTOCOLS.has(parsed.protocol)) return false;
  return parsed.origin !== SITE_ORIGIN;
}
