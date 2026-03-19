import { getCodeLanguages, normalizeCodeLang } from "@lexical/code";

type PrismLanguageLoader = () => Promise<unknown>;

const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  csharp: "csharp",
  cs: "csharp",
  dockerfile: "docker",
  golang: "go",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  kt: "kotlin",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  tsx: "tsx",
  yml: "yaml",
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

const DEFAULT_POPULAR_PRISM_LANGUAGES = [
  "bash",
  "dart",
  "docker",
  "graphql",
  "json",
  "lua",
  "perl",
  "r",
  "scala",
  "toml",
  "yaml",
  "go",
  "php",
  "ruby",
  "csharp",
  "kotlin",
  "jsx",
  "tsx",
] as const;

let loadPopularPrismLanguagesPromise: Promise<string[]> | null = null;

function normalizeLanguageId(language: string): string | null {
  const trimmed = language.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const aliasNormalized = LANGUAGE_ALIAS_MAP[trimmed] ?? trimmed;
  const lexicalNormalized = normalizeCodeLang(aliasNormalized);
  if (!lexicalNormalized) {
    return null;
  }

  return LANGUAGE_ALIAS_MAP[lexicalNormalized] ?? lexicalNormalized;
}

function getNormalizedLoadedLanguageSet(): Set<string> {
  return new Set(
    getCodeLanguages()
      .map((id) => normalizeLanguageId(id))
      .filter((id): id is string => Boolean(id)),
  );
}

export function getDefaultPopularPrismLanguages(): string[] {
  return [...DEFAULT_POPULAR_PRISM_LANGUAGES];
}

export async function loadPrismLanguages(
  languages: readonly string[],
): Promise<string[]> {
  const loaded = getNormalizedLoadedLanguageSet();
  const newlyLoaded: string[] = [];

  for (const language of languages) {
    const normalized = normalizeLanguageId(language);
    if (!normalized) {
      continue;
    }

    if (loaded.has(normalized)) {
      continue;
    }

    const loader = POPULAR_PRISM_LANGUAGE_LOADERS[normalized];
    if (!loader) {
      continue;
    }

    try {
      await loader();
    } catch {
      continue;
    }

    const postLoad = getNormalizedLoadedLanguageSet();
    if (postLoad.has(normalized)) {
      loaded.add(normalized);
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
