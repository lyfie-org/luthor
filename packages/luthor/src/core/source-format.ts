function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

export function formatJSONSource(input: string): string {
  const normalized = normalizeLineBreaks(input).trim();
  if (!normalized) {
    return "";
  }

  try {
    const parsed = JSON.parse(normalized);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return normalized;
  }
}

export function formatMarkdownSource(input: string): string {
  return normalizeLineBreaks(input).trim();
}
