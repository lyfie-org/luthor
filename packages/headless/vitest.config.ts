import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@lyfie\/luthor-headless\/(.*)$/,
        replacement: path.resolve(__dirname, "src/$1"),
      },
      {
        find: "@lyfie/luthor-headless",
        replacement: path.resolve(__dirname, "src/index.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
