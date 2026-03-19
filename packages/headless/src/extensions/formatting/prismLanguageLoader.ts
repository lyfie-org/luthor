import {
  OPTIONAL_PRISM_LANGUAGE_IDS,
  isRuntimeSupportedNormalizedCodeLanguageId,
  normalizeCodeLanguageId,
  refreshRuntimeSupportedCodeLanguages,
} from "./codeLanguageSupport";

type PrismLanguageLoader = () => Promise<unknown>;
type PrismLike = {
  languages: Record<string, unknown>;
};
type PrismModuleNamespace = {
  default?: unknown;
  Prism?: unknown;
};
type GlobalPrismHost = typeof globalThis & {
  Prism?: PrismLike;
};

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
let prismCoreReadyPromise: Promise<boolean> | null = null;
const languageLoadPromiseById = new Map<string, Promise<boolean>>();

function isPrismLike(value: unknown): value is PrismLike {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybePrism = value as Partial<PrismLike>;
  return Boolean(
    maybePrism.languages && typeof maybePrism.languages === "object",
  );
}

function getGlobalPrism(): PrismLike | null {
  const prism = (globalThis as GlobalPrismHost).Prism;
  return isPrismLike(prism) ? prism : null;
}

function resolvePrismFromModule(moduleNamespace: unknown): PrismLike | null {
  if (!moduleNamespace || typeof moduleNamespace !== "object") {
    return null;
  }

  const namespace = moduleNamespace as PrismModuleNamespace;
  if (isPrismLike(namespace.default)) {
    return namespace.default;
  }

  if (isPrismLike(namespace.Prism)) {
    return namespace.Prism;
  }

  return isPrismLike(moduleNamespace) ? moduleNamespace : null;
}

async function ensurePrismCoreGlobal(): Promise<boolean> {
  if (getGlobalPrism()) {
    return true;
  }

  if (prismCoreReadyPromise) {
    return prismCoreReadyPromise;
  }

  prismCoreReadyPromise = (async () => {
    let prismModule: unknown;

    try {
      prismModule = await import("prismjs");
    } catch {
      return false;
    }

    const resolvedPrism = resolvePrismFromModule(prismModule);
    if (!resolvedPrism) {
      return false;
    }

    (globalThis as GlobalPrismHost).Prism = resolvedPrism;
    return getGlobalPrism() !== null;
  })();

  const didLoad = await prismCoreReadyPromise;
  if (!didLoad) {
    prismCoreReadyPromise = null;
  }
  return didLoad;
}

async function loadSinglePrismLanguage(normalizedLanguage: string): Promise<boolean> {
  if (!(await ensurePrismCoreGlobal())) {
    return false;
  }

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
  if (!(await ensurePrismCoreGlobal())) {
    return [];
  }

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
