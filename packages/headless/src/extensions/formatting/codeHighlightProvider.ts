import { PrismTokenizer } from "@lexical/code";

export type CodeTokenizer = {
  defaultLanguage: string;
  tokenize: (code: string, language?: string) => unknown[];
};

export type CodeHighlightResult = {
  language?: string | null;
};

export type CodeHighlightProvider = {
  highlightAuto?: (
    code: string,
    languageSubset?: string[],
  ) => CodeHighlightResult | Promise<CodeHighlightResult>;
  tokenizer?: CodeTokenizer | null;
  getTokenizer?: () => CodeTokenizer | null | Promise<CodeTokenizer | null>;
};

export type CodeHighlightProviderConfig = {
  provider?: CodeHighlightProvider | null;
  loadProvider?: () => Promise<CodeHighlightProvider | null>;
};

const FALLBACK_HIGHLIGHT_THEME = "plain";

export function getFallbackCodeTheme(): string {
  return FALLBACK_HIGHLIGHT_THEME;
}

export function getDefaultCodeTokenizer(): CodeTokenizer {
  return PrismTokenizer as unknown as CodeTokenizer;
}

export async function resolveCodeHighlightProvider(
  config?: CodeHighlightProviderConfig,
): Promise<CodeHighlightProvider | null> {
  if (config?.provider) {
    return config.provider;
  }

  if (config?.loadProvider) {
    return config.loadProvider();
  }
  return null;
}

export async function resolveCodeTokenizer(
  provider: CodeHighlightProvider | null,
): Promise<CodeTokenizer | null> {
  if (!provider) {
    return null;
  }

  if (provider.tokenizer) {
    return provider.tokenizer;
  }

  if (!provider.getTokenizer) {
    return null;
  }

  return provider.getTokenizer();
}

export function resetCodeHighlightProviderCacheForTests(): void {}
