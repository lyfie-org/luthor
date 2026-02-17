import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: false,
  external: [
    "react",
    "react-dom",
    "@lyfie/luthor-headless",
    "lexical",
    "@lexical/code",
    "@lexical/html",
    "@lexical/link",
    "@lexical/list",
    "@lexical/markdown",
    "@lexical/react",
    "@lexical/rich-text",
    "@lexical/selection",
    "@lexical/table",
    "@lexical/utils",
  ],
  splitting: false,
  treeshake: true,
  target: "es2020",
});
