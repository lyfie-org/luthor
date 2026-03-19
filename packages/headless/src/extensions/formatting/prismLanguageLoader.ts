import {
  OPTIONAL_PRISM_LANGUAGE_IDS,
  isRuntimeSupportedNormalizedCodeLanguageId,
  normalizeCodeLanguageId,
  refreshRuntimeSupportedCodeLanguages,
} from "./codeLanguageSupport";

type PrismLanguageLoader = () => Promise<unknown>;

const POPULAR_PRISM_LANGUAGE_LOADERS: Record<string, PrismLanguageLoader> = {
  bash: () => import("prismjs/components/prism-bash.js"),
  csharp: () => import("prismjs/components/prism-csharp.js"),
  dart: () => import("prismjs/components/prism-dart.js"),
  docker: () => import("prismjs/components/prism-docker.js"),
  go: () => import("prismjs/components/prism-go.js"),
  graphql: () => import("prismjs/components/prism-graphql.js"),
  javascript: () => import("prismjs/components/prism-javascript.js"),
  json: () => import("prismjs/components/prism-json.js"),
  jsx: () => import("prismjs/components/prism-jsx.js"),
  kotlin: () => import("prismjs/components/prism-kotlin.js"),
  lua: () => import("prismjs/components/prism-lua.js"),
  perl: () => import("prismjs/components/prism-perl.js"),
  php: () => import("prismjs/components/prism-php.js"),
  r: () => import("prismjs/components/prism-r.js"),
  ruby: () => import("prismjs/components/prism-ruby.js"),
  scala: () => import("prismjs/components/prism-scala.js"),
  toml: () => import("prismjs/components/prism-toml.js"),
  tsx: () => import("prismjs/components/prism-tsx.js"),
  yaml: () => import("prismjs/components/prism-yaml.js"),
};

const DEFAULT_POPULAR_PRISM_LANGUAGES = OPTIONAL_PRISM_LANGUAGE_IDS;

let loadPopularPrismLanguagesPromise: Promise<string[]> | null = null;
const languageLoadPromiseById = new Map<string, Promise<boolean>>();

async function loadSinglePrismLanguage(normalizedLanguage: string): Promise<boolean> {
  if (isRuntimeSupportedNormalizedCodeLanguageId(normalizedLanguage)) {
    return false;
  }

  const activeLoadPromise = languageLoadPromiseById.get(normalizedLanguage);
  if (activeLoadPromise) {
    return activeLoadPromise;
  }

  const loader = POPULAR_PRISM_LANGUAGE_LOADERS[normalizedLanguage];
  if (!loader) {
    return false;
  }

  const loadPromise = (async () => {
    try {
      await loader();
    } catch {
      return false;
    }

    const refreshed = refreshRuntimeSupportedCodeLanguages();
    return refreshed.has(normalizedLanguage);
  })();

  languageLoadPromiseById.set(normalizedLanguage, loadPromise);

  try {
    return await loadPromise;
  } finally {
    languageLoadPromiseById.delete(normalizedLanguage);
  }
}

export function getDefaultPopularPrismLanguages(): string[] {
  return [...DEFAULT_POPULAR_PRISM_LANGUAGES];
}

export async function loadPrismLanguages(
  languages: readonly string[],
): Promise<string[]> {
  const newlyLoaded: string[] = [];
  const normalizedLanguageQueue: string[] = [];
  const seenRequested = new Set<string>();

  refreshRuntimeSupportedCodeLanguages();

  for (const language of languages) {
    const normalized = normalizeCodeLanguageId(language);
    if (!normalized) {
      continue;
    }

    if (seenRequested.has(normalized)) {
      continue;
    }
    seenRequested.add(normalized);

    if (isRuntimeSupportedNormalizedCodeLanguageId(normalized)) {
      continue;
    }

    if (!POPULAR_PRISM_LANGUAGE_LOADERS[normalized]) {
      continue;
    }

    normalizedLanguageQueue.push(normalized);
  }

  for (const normalized of normalizedLanguageQueue) {
    const didLoad = await loadSinglePrismLanguage(normalized);
    if (didLoad) {
      newlyLoaded.push(normalized);
    }
  }

  return newlyLoaded;
}

export async function loadPopularPrismLanguages(): Promise<string[]> {
  if (loadPopularPrismLanguagesPromise) {
    return loadPopularPrismLanguagesPromise;
  }

  loadPopularPrismLanguagesPromise = loadPrismLanguages(
    DEFAULT_POPULAR_PRISM_LANGUAGES,
  );
  return loadPopularPrismLanguagesPromise;
}
