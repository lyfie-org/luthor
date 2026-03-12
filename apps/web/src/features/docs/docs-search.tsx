'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type SearchDoc = {
  urlPath: string;
  title: string;
  description: string;
  searchableText: string;
};

type IndexedSearchDoc = SearchDoc & {
  normalizedTitle: string;
  normalizedDescription: string;
  normalizedContent: string;
  plainContent: string;
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
    .replace(/[`*_~#>|()[\]{}.,;:/\\!?+=-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeQuery(query: string): string[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];
  const tokens = normalized.split(' ').filter(Boolean);
  return Array.from(new Set(tokens));
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

function scoreDoc(doc: IndexedSearchDoc, rawQuery: string, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;

  const queryNormalized = normalizeForSearch(rawQuery);
  const title = doc.normalizedTitle;
  const description = doc.normalizedDescription;
  const content = doc.normalizedContent;
  const aggregate = `${title} ${description} ${content}`;

  if (!queryTokens.every((token) => aggregate.includes(token))) {
    return 0;
  }

  let score = 0;

  if (queryNormalized && title === queryNormalized) score += 220;
  if (queryNormalized && title.startsWith(queryNormalized)) score += 140;
  if (queryNormalized && title.includes(queryNormalized)) score += 90;
  if (queryNormalized && description.includes(queryNormalized)) score += 40;
  if (queryNormalized && content.includes(queryNormalized)) score += 20;

  for (const token of queryTokens) {
    if (title.startsWith(token)) score += 45;
    else if (title.includes(token)) score += 28;

    if (description.includes(token)) score += 18;
    if (content.includes(token)) score += 8;
  }

  return score;
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
  const normalizedQuery = query.trim();
  const queryTokens = useMemo(() => tokenizeQuery(normalizedQuery), [normalizedQuery]);

  const indexedDocs = useMemo<IndexedSearchDoc[]>(
    () =>
      docs.map((doc) => {
        const plainContent = toPlainSearchText(doc.searchableText);
        return {
          ...doc,
          plainContent,
          normalizedTitle: normalizeForSearch(doc.title),
          normalizedDescription: normalizeForSearch(doc.description),
          normalizedContent: normalizeForSearch(plainContent),
        };
      }),
    [docs],
  );

  const results = useMemo<SearchResult[]>(() => {
    if (queryTokens.length === 0) return [];

    return indexedDocs
      .map((doc) => {
        const score = scoreDoc(doc, normalizedQuery, queryTokens);
        if (score <= 0) return null;
        return {
          doc,
          score,
          snippet: createSnippet(doc.plainContent, queryTokens),
        };
      })
      .filter((result): result is SearchResult => result !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [indexedDocs, normalizedQuery, queryTokens]);

  return (
    <div className="docs-search" role="search">
      <label className="docs-search-label" htmlFor="docs-search-input">Search docs</label>
      <input
        id="docs-search-input"
        className="docs-search-input"
        type="search"
        placeholder="Search props, methods, commands, and examples"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {normalizedQuery.length > 0 ? (
        <p className="docs-search-meta">
          {`${results.length} result${results.length === 1 ? '' : 's'}`}
        </p>
      ) : null}
      {results.length > 0 ? (
        <ul className="docs-search-results">
          {results.map((result) => (
            <li key={result.doc.urlPath}>
              <Link href={result.doc.urlPath} className="docs-search-link">
                <span className="docs-search-title">{highlight(result.doc.title, queryTokens)}</span>
                <span className="docs-search-snippet">{highlight(result.snippet, queryTokens)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : normalizedQuery.length > 0 ? (
        <p className="docs-search-meta">No matches found. Try a prop name, command ID, or method.</p>
      ) : null}
    </div>
  );
}
