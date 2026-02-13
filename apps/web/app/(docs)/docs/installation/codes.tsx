import { RegisteredCodeSnippet } from "../../lib/types";

// Installation examples
export const INSTALLATION_EXAMPLES: RegisteredCodeSnippet[] = [
  {
    id: "install-npm",
    code: "npm install @lyfie/luthor",
    language: "bash",
    title: "Install with npm",
    description: "Install Luthor using npm",
  },
  {
    id: "install-pnpm",
    code: "pnpm add @lyfie/luthor",
    language: "bash",
    title: "Install with pnpm",
    description: "Install Luthor using pnpm",
  },
  {
    id: "install-yarn",
    code: "yarn add @lyfie/luthor",
    language: "bash",
    title: "Install with yarn",
    description: "Install Luthor using yarn",
  },
];

// Combine all examples for default export
export default INSTALLATION_EXAMPLES;
