/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { Metadata } from 'next';
import DocsPage, { generateMetadata as generateDocMetadata } from './[...slug]/page';

export const dynamic = 'force-static';
export const revalidate = false;

const docsIndexParams = Promise.resolve({ slug: ['getting-started'] });

export async function generateMetadata(): Promise<Metadata> {
  return generateDocMetadata({ params: docsIndexParams });
}

export default async function DocsIndexPage() {
  return DocsPage({ params: docsIndexParams });
}
