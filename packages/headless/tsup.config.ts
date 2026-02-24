import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: false, // Disable source maps for production bundle
  external: [
    "react",
    "react-dom",
    "lexical",
    "@lexical/code",
    "@lexical/link",
    "@lexical/list",
    "@lexical/markdown",
    "@lexical/react",
    "@lexical/rich-text",
    "@lexical/selection",
    "@lexical/table",
    "@lexical/utils",
    "highlight.js",
  ],
  splitting: false,
  treeshake: true,
  target: "es2020",
});
