#!/usr/bin/env node

/**
 * Post-build script for Cloudflare deployment.
 *
 * OpenNext stores pre-rendered HTML in `.open-next/cache/{BUILD_ID}/*.cache`
 * as JSON blobs, but the Worker uses a "dummy" incremental cache by default
 * so it never reads them — causing 404s for `force-static` routes at runtime.
 *
 * Fix: extract the `html` field from each cache entry and write it to
 * `.open-next/assets/{path}/index.html`. Cloudflare Workers with
 * `assets.directory` serves those files directly from CDN (before invoking
 * the Worker), giving us true edge-cached static delivery with zero CPU cost.
 */

import fs from 'node:fs';
import path from 'node:path';

const OPEN_NEXT_DIR = '.open-next';
const ASSETS_DIR = path.join(OPEN_NEXT_DIR, 'assets');
const CACHE_DIR = path.join(OPEN_NEXT_DIR, 'cache');

// Pages that should not be served as CDN-level static files
const SKIP_NAMES = new Set(['_not-found', '500', 'sitemap.xml', '_error']);

function getBuildId() {
  const buildIdPath = path.join(ASSETS_DIR, 'BUILD_ID');
  if (!fs.existsSync(buildIdPath)) {
    throw new Error(`BUILD_ID file not found at ${buildIdPath}. Run the OpenNext build first.`);
  }
  return fs.readFileSync(buildIdPath, 'utf8').trim();
}

function walkCacheDir(dir, baseDir = dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip the __fetch cache subdirectory (not page HTML)
      if (entry.name === '__fetch') continue;
      walkCacheDir(fullPath, baseDir, results);
    } else if (entry.name.endsWith('.cache')) {
      const relPath = path.relative(baseDir, fullPath);
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

function cacheRelPathToAssetPath(relPath) {
  // relPath examples (using POSIX separators after normalising):
  //   index.cache          → index.html
  //   docs.cache           → docs/index.html
  //   docs/getting-started.cache → docs/getting-started/index.html
  const posix = relPath.split(path.sep).join('/');
  const withoutExt = posix.replace(/\.cache$/, '');

  if (withoutExt === 'index') {
    return 'index.html';
  }

  return `${withoutExt}/index.html`;
}

function run() {
  const buildId = getBuildId();
  const buildCacheDir = path.join(CACHE_DIR, buildId);

  if (!fs.existsSync(buildCacheDir)) {
    console.error(`Cache directory not found: ${buildCacheDir}`);
    process.exit(1);
  }

  const cacheFiles = walkCacheDir(buildCacheDir);
  let extracted = 0;
  let skipped = 0;

  for (const { fullPath, relPath } of cacheFiles) {
    const posixRel = relPath.split(path.sep).join('/');
    const nameWithoutExt = path.basename(posixRel, '.cache');

    if (SKIP_NAMES.has(nameWithoutExt)) {
      skipped++;
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch {
      console.warn(`  [skip] Failed to parse ${relPath}`);
      skipped++;
      continue;
    }

    if (parsed.type !== 'app' || typeof parsed.html !== 'string') {
      skipped++;
      continue;
    }

    const assetRelPath = cacheRelPathToAssetPath(posixRel);
    const assetFullPath = path.join(ASSETS_DIR, ...assetRelPath.split('/'));
    const displayUrl = posixRel.replace(/\.cache$/, '') === 'index' ? '/' : `/${posixRel.replace(/\.cache$/, '')}/`;

    fs.mkdirSync(path.dirname(assetFullPath), { recursive: true });
    fs.writeFileSync(assetFullPath, parsed.html, 'utf8');
    console.log(`  [ok] ${displayUrl} → assets/${assetRelPath}`);
    extracted++;
  }

  console.log(`\nDone. Extracted ${extracted} page(s), skipped ${skipped}.`);
}

run();
