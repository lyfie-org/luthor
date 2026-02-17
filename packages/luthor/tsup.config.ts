import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: false,
  external: ["react", "react-dom"],
  splitting: false,
  treeshake: true,
  target: "es2020",
});
