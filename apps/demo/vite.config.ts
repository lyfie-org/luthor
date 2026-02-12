import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@lyfie/luthor": path.resolve(
        __dirname,
        "../../packages/luthor/src"
      )
    }
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, "../..")
      ]
    }
  },
  optimizeDeps: {
    exclude: ["@lyfie/luthor"]
  },
  css: {
    devSourcemap: true
  }
})
