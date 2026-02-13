import { codeToHtml } from "shiki";
import { RegisteredCodeSnippet } from "./types";
import { allCodesModules } from "../../../lib/generated/codes-loader";

// Cache for highlighted HTML
const codeCache = new Map<string, string>();

// Registry of snippet metadata
const codeRegistry = new Map<string, RegisteredCodeSnippet>();

// Load code files via the generated loader
async function loadCodeFiles() {
  // Use the generated loader to import all code modules
  for (const codeModule of allCodesModules) {
    try {
      // Handle named exports like INSTALLATION_EXAMPLES and EXTENSION_EXAMPLES
      Object.values(codeModule).forEach((exportValue: any) => {
        if (Array.isArray(exportValue)) {
          exportValue.forEach((snippet: RegisteredCodeSnippet) => {
            codeRegistry.set(snippet.id, snippet);
          });
        }
      });
    } catch (error) {
      console.warn("Failed to load code module:", error);
    }
  }
}

// Initialize the snippet registry
async function initializeRegistry() {
  await loadCodeFiles();
}

// Initialize on module load
initializeRegistry();

/**
 * Return raw code for a snippet ID
 */
export function getRawCode(id: string): string | undefined {
  return codeRegistry.get(id)?.code;
}

/**
 * Return highlighted HTML for a snippet ID
 */
export async function getHighlightedCode(
  id: string,
): Promise<string | undefined> {
  // Check cache first
  if (codeCache.has(id)) {
    return codeCache.get(id);
  }

  const snippet = codeRegistry.get(id);
  if (!snippet) return undefined;

  try {
    const html = await codeToHtml(snippet.code, {
      lang: snippet.language,
      theme: "github-dark",
      transformers: [
        {
          line(node, line) {
            if (snippet.highlightLines?.includes(line)) {
              node.properties.class = "highlighted";
            }
          },
        },
      ],
    });

    // Store the result in the cache
    codeCache.set(id, html);
    return html;
  } catch (error) {
    console.error("Error highlighting code:", error);
    return snippet.code;
  }
}

/**
 * List registered snippet IDs
 */
export function getAllSnippetIds(): string[] {
  return Array.from(codeRegistry.keys());
}

/**
 * Get snippet metadata
 */
export function getSnippetMetadata(
  id: string,
): RegisteredCodeSnippet | undefined {
  return codeRegistry.get(id);
}
