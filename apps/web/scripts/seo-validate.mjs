import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function fail(errors) {
  for (const error of errors) {
    console.error(`SEO validation failed: ${error}`);
  }
  process.exit(1);
}

const siteConfig = read('src/config/site.ts');
const layout = read('src/app/layout.tsx');
const homePage = read('src/app/page.tsx');

const errors = [];

const descriptionMatch = siteConfig.match(/SITE_DESCRIPTION\s*=\s*'([^']+)'/);
const description = descriptionMatch?.[1] ?? '';
if (!description || description.length < 120 || description.length > 160) {
  errors.push('SITE_DESCRIPTION should be between 120 and 160 characters.');
}

if (!layout.includes("canonical: '/'")) {
  errors.push('Global canonical metadata is missing from layout metadata.');
}

if (!layout.includes('apple-touch-icon.png')) {
  errors.push('Apple touch icon metadata is missing.');
}

if (!homePage.includes('<h1 className="hero-title">')) {
  errors.push('Homepage H1 is missing.');
}

const requiredAnchors = ['id="getting-started"', 'id="installation"', 'id="demo"', 'id="features"'];
for (const anchor of requiredAnchors) {
  if (!homePage.includes(anchor)) {
    errors.push(`Homepage is missing required section anchor: ${anchor}`);
  }
}

const strippedHome = homePage
  .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, ' ')
  .replace(/[{}()[\];,.<>/=+*"`]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const wordCount = strippedHome.split(' ').filter(Boolean).length;
if (wordCount < 250) {
  errors.push(`Homepage content appears too short (${wordCount} words).`);
}

if (errors.length > 0) {
  fail(errors);
}

console.log('SEO validation passed.');
