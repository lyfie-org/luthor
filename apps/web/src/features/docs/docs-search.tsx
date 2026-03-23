'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type DocPackage = 'luthor' | 'headless' | 'shared' | 'integrations' | 'contributor';
type DocType = 'guide' | 'concept' | 'reference' | 'integration' | 'tutorial';
type DocSurface = 'preset' | 'extension' | 'command' | 'prop' | 'bridge' | 'node' | 'tooling';

type SearchTokenBuckets = {
  keywords: string[];
  props: string[];
  exports: string[];
  commands: string[];
  extensions: string[];
  nodes: string[];
  frameworks: string[];
};

type SearchDocSection = {
  heading: string;
  id: string;
  level: number;
  text: string;
};

type SearchDoc = {
  urlPath: string;
  title: string;
  description: string;
  package: DocPackage;
  docType: DocType;
  surface: DocSurface;
  searchableText: string;
  sections: SearchDocSection[];
  searchTokenBuckets: SearchTokenBuckets;
};

type ParsedQueryFilters = {
  pkg?: DocPackage;
  type?: DocType;
  surface?: DocSurface;
};

type ParsedQuery = {
  filters: ParsedQueryFilters;
  queryText: string;
  tokens: string[];
};

type IndexedSearchDoc = SearchDoc & {
  normalizedTitle: string;
  normalizedDescription: string;
  normalizedBody: string;
  normalizedAggregate: string;
  normalizedTokenBuckets: SearchTokenBuckets;
};

type SearchResult = {
  doc: IndexedSearchDoc;
  score: number;
  snippet: string;
};

type DocsSearchProps = {
  docs: SearchDoc[];
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_~#>|()[\]{}.,;:/\\!?+=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeQuery(query: string): string[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];
  return Array.from(new Set(normalized.split(' ').filter(Boolean)));
}

function normalizeFilterValue(value: string): string {
  return value.trim().toLowerCase();
}

function resolvePackageFilter(input: string): DocPackage | null {
  const value = normalizeFilterValue(input);
  if (value === 'luthor') return 'luthor';
  if (value === 'headless' || value === 'luthor-headless') return 'headless';
  if (value === 'shared') return 'shared';
  if (value === 'integrations' || value === 'integration') return 'integrations';
  if (value === 'contributor' || value === 'contributing') return 'contributor';
  return null;
}

function resolveDocTypeFilter(input: string): DocType | null {
  const value = normalizeFilterValue(input);
  if (value === 'guide' || value === 'concept' || value === 'reference' || value === 'integration' || value === 'tutorial') {
    return value;
  }
  return null;
}

function resolveSurfaceFilter(input: string): DocSurface | null {
  const value = normalizeFilterValue(input);
  if (
    value === 'preset' ||
    value === 'extension' ||
    value === 'command' ||
    value === 'prop' ||
    value === 'bridge' ||
    value === 'node' ||
    value === 'tooling'
  ) {
    return value;
  }
  return null;
}

function parseQuery(rawQuery: string): ParsedQuery {
  const chunks = rawQuery.trim().split(/\s+/).filter(Boolean);
  const textChunks: string[] = [];
  const filters: ParsedQueryFilters = {};

  for (const chunk of chunks) {
    const filterMatch = chunk.match(/^([a-z]+):(.*)$/i);
    if (!filterMatch) {
      textChunks.push(chunk);
      continue;
    }

    const key = filterMatch[1]?.toLowerCase();
    const value = filterMatch[2] ?? '';
    if (!value) {
      textChunks.push(chunk);
      continue;
    }

    if (key === 'pkg') {
      const parsedPackage = resolvePackageFilter(value);
      if (parsedPackage) {
        filters.pkg = parsedPackage;
        continue;
      }
    }

    if (key === 'type') {
      const parsedType = resolveDocTypeFilter(value);
      if (parsedType) {
        filters.type = parsedType;
        continue;
      }
    }

    if (key === 'surface') {
      const parsedSurface = resolveSurfaceFilter(value);
      if (parsedSurface) {
        filters.surface = parsedSurface;
        continue;
      }
    }

    textChunks.push(chunk);
  }

  const queryText = textChunks.join(' ');
  return {
    filters,
    queryText,
    tokens: tokenizeQuery(queryText),
  };
}

function toPlainSearchText(markdown: string): string {
  return markdown
    .replace(/```([\w-]+)?\n?/g, ' ')
    .replace(/```/g, ' ')
    .replace(/`([^`]*)`/g, ' $1 ')
    .replace(/!\[([^\]]*)]\([^)]*\)/g, ' $1 ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, ' $1 ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#>*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTokenList(values: string[]): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const normalized = normalizeForSearch(value);
    if (!normalized) continue;
    set.add(normalized);
  }
  return [...set];
}

function createSnippet(content: string, queryTokens: string[]): string {
  if (!content.trim()) return '';
  if (queryTokens.length === 0) return content.slice(0, 220);

  const lower = content.toLowerCase();
  let firstMatchIndex = -1;
  let firstMatchToken = '';

  for (const token of queryTokens) {
    const index = lower.indexOf(token.toLowerCase());
    if (index === -1) continue;
    if (firstMatchIndex === -1 || index < firstMatchIndex) {
      firstMatchIndex = index;
      firstMatchToken = token;
    }
  }

  if (firstMatchIndex === -1) return content.slice(0, 220);

  const start = Math.max(0, firstMatchIndex - 80);
  const end = Math.min(content.length, firstMatchIndex + firstMatchToken.length + 140);
  const prefix = start > 0 ? '... ' : '';
  const suffix = end < content.length ? ' ...' : '';
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

function matchFilters(doc: IndexedSearchDoc, filters: ParsedQueryFilters): boolean {
  if (filters.pkg && doc.package !== filters.pkg) return false;
  if (filters.type && doc.docType !== filters.type) return false;
  if (filters.surface && doc.surface !== filters.surface) return false;
  return true;
}

function tokenExistsInBucket(bucket: string[], token: string): boolean {
  return bucket.includes(token);
}

function scoreDoc(doc: IndexedSearchDoc, parsedQuery: ParsedQuery): number {
  const { tokens, queryText, filters } = parsedQuery;
  if (!matchFilters(doc, filters)) return 0;

  if (tokens.length === 0) {
    return Object.keys(filters).length > 0 ? 10 : 0;
  }

  if (!tokens.every((token) => doc.normalizedAggregate.includes(token))) {
    return 0;
  }

  let score = 0;
  const normalizedPhrase = normalizeForSearch(queryText);

  if (normalizedPhrase && doc.normalizedTitle === normalizedPhrase) score += 240;
  if (normalizedPhrase && doc.normalizedTitle.startsWith(normalizedPhrase)) score += 150;
  if (normalizedPhrase && doc.normalizedTitle.includes(normalizedPhrase)) score += 100;
  if (normalizedPhrase && doc.normalizedDescription.includes(normalizedPhrase)) score += 45;
  if (normalizedPhrase && doc.normalizedBody.includes(normalizedPhrase)) score += 20;
  if (normalizedPhrase && tokenExistsInBucket(doc.normalizedTokenBuckets.commands, normalizedPhrase)) score += 320;
  if (normalizedPhrase && tokenExistsInBucket(doc.normalizedTokenBuckets.exports, normalizedPhrase)) score += 280;
  if (normalizedPhrase && tokenExistsInBucket(doc.normalizedTokenBuckets.props, normalizedPhrase)) score += 240;
  if (normalizedPhrase && tokenExistsInBucket(doc.normalizedTokenBuckets.extensions, normalizedPhrase)) score += 220;
  if (normalizedPhrase && tokenExistsInBucket(doc.normalizedTokenBuckets.nodes, normalizedPhrase)) score += 200;

  for (const token of tokens) {
    if (tokenExistsInBucket(doc.normalizedTokenBuckets.commands, token)) score += 260;
    if (tokenExistsInBucket(doc.normalizedTokenBuckets.exports, token)) score += 225;
    if (tokenExistsInBucket(doc.normalizedTokenBuckets.props, token)) score += 200;
    if (tokenExistsInBucket(doc.normalizedTokenBuckets.extensions, token)) score += 190;
    if (tokenExistsInBucket(doc.normalizedTokenBuckets.nodes, token)) score += 170;
    if (tokenExistsInBucket(doc.normalizedTokenBuckets.keywords, token)) score += 110;
    if (tokenExistsInBucket(doc.normalizedTokenBuckets.frameworks, token)) score += 80;

    if (doc.normalizedTitle.startsWith(token)) score += 50;
    else if (doc.normalizedTitle.includes(token)) score += 30;

    if (doc.normalizedDescription.includes(token)) score += 20;
    if (doc.normalizedBody.includes(token)) score += 10;
  }

  return score;
}

function pickBestSectionSnippet(doc: IndexedSearchDoc, queryTokens: string[]): string | null {
  if (doc.sections.length === 0 || queryTokens.length === 0) return null;

  let bestSection: SearchDocSection | null = null;
  let bestMatchCount = -1;
  let bestFirstIndex = Number.POSITIVE_INFINITY;

  for (const section of doc.sections) {
    const normalizedSection = normalizeForSearch(section.text);
    if (!normalizedSection) continue;

    let matchCount = 0;
    let firstIndex = Number.POSITIVE_INFINITY;
    for (const token of queryTokens) {
      const index = normalizedSection.indexOf(token);
      if (index === -1) continue;
      matchCount += 1;
      if (index < firstIndex) {
        firstIndex = index;
      }
    }

    if (matchCount === 0) continue;
    if (matchCount > bestMatchCount || (matchCount === bestMatchCount && firstIndex < bestFirstIndex)) {
      bestSection = section;
      bestMatchCount = matchCount;
      bestFirstIndex = firstIndex;
    }
  }

  if (!bestSection) return null;
  return createSnippet(bestSection.text, queryTokens);
}

function highlight(text: string, queryTokens: string[]): ReactNode {
  const filtered = queryTokens.filter((token) => token.length > 0);
  if (filtered.length === 0 || !text.trim()) return text;

  const pattern = new RegExp(`(${filtered.map(escapeRegex).join('|')})`, 'ig');
  const parts = text.split(pattern);
  return parts.map((part, index) =>
    filtered.some((token) => token.toLowerCase() === part.toLowerCase()) ? <mark key={`${part}-${index}`}>{part}</mark> : part,
  );
}

export function DocsSearch({ docs }: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const parsedQuery = useMemo(() => parseQuery(trimmedQuery), [trimmedQuery]);
  const hasFilters = Boolean(parsedQuery.filters.pkg || parsedQuery.filters.type || parsedQuery.filters.surface);

  const indexedDocs = useMemo<IndexedSearchDoc[]>(
    () =>
      docs.map((doc) => {
        const plainBody = toPlainSearchText(doc.searchableText);
        const normalizedBuckets: SearchTokenBuckets = {
          keywords: normalizeTokenList(doc.searchTokenBuckets.keywords),
          props: normalizeTokenList(doc.searchTokenBuckets.props),
          exports: normalizeTokenList(doc.searchTokenBuckets.exports),
          commands: normalizeTokenList(doc.searchTokenBuckets.commands),
          extensions: normalizeTokenList(doc.searchTokenBuckets.extensions),
          nodes: normalizeTokenList(doc.searchTokenBuckets.nodes),
          frameworks: normalizeTokenList(doc.searchTokenBuckets.frameworks),
        };

        const aggregate = [
          normalizeForSearch(doc.title),
          normalizeForSearch(doc.description),
          normalizeForSearch(plainBody),
          ...normalizedBuckets.keywords,
          ...normalizedBuckets.props,
          ...normalizedBuckets.exports,
          ...normalizedBuckets.commands,
          ...normalizedBuckets.extensions,
          ...normalizedBuckets.nodes,
          ...normalizedBuckets.frameworks,
        ]
          .filter(Boolean)
          .join(' ');

        return {
          ...doc,
          normalizedTitle: normalizeForSearch(doc.title),
          normalizedDescription: normalizeForSearch(doc.description),
          normalizedBody: normalizeForSearch(plainBody),
          normalizedAggregate: aggregate,
          normalizedTokenBuckets: normalizedBuckets,
        };
      }),
    [docs],
  );

  const results = useMemo<SearchResult[]>(() => {
    if (parsedQuery.tokens.length === 0 && !hasFilters) return [];

    return indexedDocs
      .map((doc) => {
        const score = scoreDoc(doc, parsedQuery);
        if (score <= 0) return null;

        const sectionSnippet = pickBestSectionSnippet(doc, parsedQuery.tokens);
        const snippet = sectionSnippet ?? createSnippet(doc.searchableText, parsedQuery.tokens);
        return { doc, score, snippet };
      })
      .filter((result): result is SearchResult => result !== null)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.doc.title.localeCompare(b.doc.title);
      })
      .slice(0, 12);
  }, [hasFilters, indexedDocs, parsedQuery]);

  return (
    <div className="docs-search" role="search">
      <label className="docs-search-label" htmlFor="docs-search-input">Search docs</label>
      <input
        id="docs-search-input"
        className="docs-search-input"
        type="search"
        placeholder="Search props, commands, exports, extensions (use pkg:, type:, surface: filters)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {trimmedQuery.length > 0 ? (
        <p className="docs-search-meta">
          {`${results.length} result${results.length === 1 ? '' : 's'}`}
        </p>
      ) : null}
      {results.length > 0 ? (
        <ul className="docs-search-results">
          {results.map((result) => (
            <li key={result.doc.urlPath}>
              <Link href={result.doc.urlPath} className="docs-search-link">
                <span className="docs-search-title">{highlight(result.doc.title, parsedQuery.tokens)}</span>
                <span className="docs-search-snippet">{highlight(result.snippet, parsedQuery.tokens)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : trimmedQuery.length > 0 ? (
        <p className="docs-search-meta">No matches found. Try `pkg:luthor type:reference surface:command insert.table`.</p>
      ) : null}
    </div>
  );
}
