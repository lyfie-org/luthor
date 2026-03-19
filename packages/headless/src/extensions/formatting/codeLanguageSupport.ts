import { getCodeLanguages, normalizeCodeLang } from "@lexical/code";

export const CODE_LANGUAGE_ALIAS_MAP: Record<string, string> = {
  js: "javascript",
  py: "python",
  ts: "typescript",
};

let runtimeSupportedLanguageSetCache: Set<string> | null = null;

export function normalizeCodeLanguageId(
  language: string | null | undefined,
): string | null {
  if (!language) {
    return null;
  }

  const trimmed = language.trim().toLowerCase();
  if (!trimmed || trimmed === "auto") {
    return null;
  }

  const aliasNormalized = CODE_LANGUAGE_ALIAS_MAP[trimmed] ?? trimmed;
  const lexicalNormalized = normalizeCodeLang(aliasNormalized);
  if (!lexicalNormalized || lexicalNormalized === "auto") {
    return null;
  }

  return CODE_LANGUAGE_ALIAS_MAP[lexicalNormalized] ?? lexicalNormalized;
}

function computeRuntimeSupportedLanguageSet(): Set<string> {
  return new Set(
    getCodeLanguages()
      .map((id) => normalizeCodeLanguageId(id))
      .filter((id): id is string => Boolean(id)),
  );
}

function getRuntimeSupportedLanguageSet(): Set<string> {
  if (!runtimeSupportedLanguageSetCache) {
    runtimeSupportedLanguageSetCache = computeRuntimeSupportedLanguageSet();
  }

  return runtimeSupportedLanguageSetCache;
}

export function refreshRuntimeSupportedCodeLanguages(): Set<string> {
  runtimeSupportedLanguageSetCache = computeRuntimeSupportedLanguageSet();
  return new Set(runtimeSupportedLanguageSetCache);
}

export function getRuntimeSupportedCodeLanguagesSnapshot(): Set<string> {
  return new Set(getRuntimeSupportedLanguageSet());
}

export function isRuntimeSupportedNormalizedCodeLanguageId(
  normalizedLanguage: string,
): boolean {
  const trimmed = normalizedLanguage.trim().toLowerCase();
  if (!trimmed) {
    return false;
  }

  return getRuntimeSupportedLanguageSet().has(trimmed);
}

export function isRuntimeSupportedCodeLanguage(
  language: string | null | undefined,
): boolean {
  const normalized = normalizeCodeLanguageId(language);
  if (!normalized) {
    return false;
  }

  return isRuntimeSupportedNormalizedCodeLanguageId(normalized);
}

export function isKnownCodeLanguage(
  language: string | null | undefined,
): boolean {
  return isRuntimeSupportedCodeLanguage(language);
}

export function normalizeKnownCodeLanguageId(
  language: string | null | undefined,
): string | null {
  const normalized = normalizeCodeLanguageId(language);
  if (!normalized) {
    return null;
  }

  return isKnownCodeLanguage(normalized) ? normalized : null;
}
