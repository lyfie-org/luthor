import { Metadata } from "next";
import { docsConfig } from "../lib/docs-config";

export function generateDocsMetadata(pathname: string): Metadata {
  // Normalize pathname (remove trailing slashes, handle index routes)
  const normalizedPath = pathname.replace(/\/$/, "") || "/docs";

  // Find page data from docs config
  for (const section of docsConfig) {
    for (const item of section.items) {
      if (item.href === normalizedPath) {
        const baseTitle = "Luthor Documentation";
        const baseDescription =
          "Type-safe rich text editor framework built on Meta's Lexical. Developer-friendly, extensible, and production-ready.";

        return {
          title: `${item.title} | ${baseTitle}`,
          description: item.description || baseDescription,
          keywords: [
            "Luthor",
            "rich text editor",
            "TypeScript",
            "Lexical",
            "documentation",
            item.title.toLowerCase(),
            ...(item.isNew ? ["new"] : []),
          ].filter(Boolean),
          openGraph: {
            title: `${item.title} | Luthor Documentation`,
            description: item.description || baseDescription,
            type: "article",
            siteName: "Luthor",
          },
          twitter: {
            card: "summary_large_image",
            title: `${item.title} | Luthor Documentation`,
            description: item.description || baseDescription,
          },
        };
      }
    }
  }

  // Handle special cases
  if (normalizedPath === "/docs") {
    return {
      title: "Luthor Documentation",
      description:
        "Type-safe rich text editor framework built on Meta's Lexical. Developer-friendly, extensible, and production-ready.",
      keywords: [
        "Luthor",
        "rich text editor",
        "TypeScript",
        "Lexical",
        "documentation",
      ],
      openGraph: {
        title: "Luthor Documentation",
        description:
          "Type-safe rich text editor framework built on Meta's Lexical. Developer-friendly, extensible, and production-ready.",
        type: "website",
        siteName: "Luthor",
      },
      twitter: {
        card: "summary_large_image",
        title: "Luthor Documentation",
        description:
          "Type-safe rich text editor framework built on Meta's Lexical. Developer-friendly, extensible, and production-ready.",
      },
    };
  }

  // Generate metadata for unknown paths (extensions, API docs, etc.)
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const title = lastSegment
    ? lastSegment.charAt(0).toUpperCase() +
      lastSegment.slice(1).replace(/-/g, " ")
    : "Documentation";

  return {
    title: `${title} | Luthor Documentation`,
    description: `Learn about ${title.toLowerCase()} in Luthor documentation. Type-safe rich text editor framework built on Meta's Lexical.`,
    keywords: [
      "Luthor",
      "rich text editor",
      "TypeScript",
      "Lexical",
      "documentation",
      title.toLowerCase(),
    ],
    openGraph: {
      title: `${title} | Luthor Documentation`,
      description: `Learn about ${title.toLowerCase()} in Luthor documentation. Type-safe rich text editor framework built on Meta's Lexical.`,
      type: "article",
      siteName: "Luthor",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Luthor Documentation`,
      description: `Learn about ${title.toLowerCase()} in Luthor documentation. Type-safe rich text editor framework built on Meta's Lexical.`,
    },
  };
}
