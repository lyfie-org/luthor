import { docsIndex } from '@/data/docs-index.generated';

export interface DocEntry {
  slug: string[];
  title: string;
  description: string;
  content: string;
  urlPath: string;
  sourcePath: string;
  updatedAt: string;
}

function normalizeSlug(slug: string[]): string {
  return slug.join('/');
}

const normalizedDocs: DocEntry[] = (docsIndex as DocEntry[]).map((doc) => ({
  ...doc,
  slug: Array.isArray(doc.slug) ? doc.slug : [],
}));

const docsBySlug = new Map(normalizedDocs.map((doc) => [normalizeSlug(doc.slug), doc]));

export async function getDocBySlug(slug: string[]): Promise<DocEntry | null> {
  return docsBySlug.get(normalizeSlug(slug)) ?? null;
}

export async function getAllDocs(): Promise<DocEntry[]> {
  return [...normalizedDocs];
}

export async function getAllDocSlugs(): Promise<string[][]> {
  const docs = await getAllDocs();
  return docs.map((doc) => doc.slug);
}
