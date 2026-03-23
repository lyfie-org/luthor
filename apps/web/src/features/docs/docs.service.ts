import { docsIndex } from '@/data/docs-index.generated';
import { docsApiIndex } from '@/data/docs-api-index.generated';

export interface DocHeading {
  level: number;
  text: string;
  id: string;
}

export interface DocSection {
  heading: string;
  id: string;
  level: number;
  text: string;
}

export interface DocSearchTokenBuckets {
  keywords: string[];
  props: string[];
  exports: string[];
  commands: string[];
  extensions: string[];
  nodes: string[];
  frameworks: string[];
}

export interface DocEntry {
  slug: string[];
  title: string;
  navTitle: string;
  description: string;
  content: string;
  plainContent: string;
  sections: DocSection[];
  headings: DocHeading[];
  urlPath: string;
  sourcePath: string;
  updatedAt: string;
  package: 'luthor' | 'headless' | 'shared' | 'integrations' | 'contributor';
  docType: 'guide' | 'concept' | 'reference' | 'integration' | 'tutorial';
  surface: 'preset' | 'extension' | 'command' | 'prop' | 'bridge' | 'node' | 'tooling';
  keywords: string[];
  props: string[];
  exports: string[];
  commands: string[];
  extensions: string[];
  nodes: string[];
  frameworks: string[];
  lastVerifiedFrom: string[];
  navGroup: 'start_here' | 'luthor' | 'luthor_headless' | 'integrations' | 'reference' | 'contributing' | 'other';
  navOrder: number;
  navHidden: boolean;
  searchTokens: string[];
  searchTokenBuckets: DocSearchTokenBuckets;
}

export interface DocsApiEntry {
  urlPath: string;
  title: string;
  package: DocEntry['package'];
  docType: DocEntry['docType'];
  surface: DocEntry['surface'];
  navGroup: DocEntry['navGroup'];
  searchTokens: string[];
  searchTokenBuckets: DocSearchTokenBuckets;
}

function normalizeSlug(slug: string[]): string {
  return slug.join('/');
}

const normalizedDocs: DocEntry[] = (docsIndex as DocEntry[]).map((doc) => ({
  ...doc,
  slug: Array.isArray(doc.slug) ? doc.slug : [],
}));

const docsBySlug = new Map(normalizedDocs.map((doc) => [normalizeSlug(doc.slug), doc]));
const docsApiEntries = docsApiIndex as DocsApiEntry[];

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

export async function getDocsApiIndex(): Promise<DocsApiEntry[]> {
  return [...docsApiEntries];
}
