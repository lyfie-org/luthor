function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function decodeMarkdownWhitespaceEntities(input: string): string {
  return input.replace(/&#(9|10|13|32|160);/g, (_match, code) => {
    switch (code) {
      case "9":
        return "\t";
      case "10":
        return "\n";
      case "13":
        return "\r";
      case "32":
        return " ";
      case "160":
        return " ";
      default:
        return _match;
    }
  });
}

function moveWhitespaceOutsideMarker(input: string, marker: string): string {
  const escaped = marker.replace(/([*~])/g, "\\$1");

  let output = input;
  // Move leading whitespace outside markers: ** text** ->  **text**
  output = output.replace(
    new RegExp(`${escaped}(\\s+)([^\\n]+?)${escaped}`, "g"),
    (_match, leading, content) => `${leading}${marker}${content}${marker}`,
  );
  // Move trailing whitespace outside markers: **text ** -> **text** 
  output = output.replace(
    new RegExp(`${escaped}([^\\n]+?)(\\s+)${escaped}`, "g"),
    (_match, content, trailing) => `${marker}${content}${marker}${trailing}`,
  );

  return output;
}

function normalizeInlineMarkdownWhitespace(input: string): string {
  const markers = ["***", "**", "~~", "*"];
  return markers.reduce((value, marker) => moveWhitespaceOutsideMarker(value, marker), input);
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
  return normalizeInlineMarkdownWhitespace(decodeMarkdownWhitespaceEntities(normalizeLineBreaks(input))).trim();
}
