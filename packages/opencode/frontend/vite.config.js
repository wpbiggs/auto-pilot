import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Path from /packages/opencode/frontend to /packages/sdk/js/src
      "@opencode-sdk": path.resolve(__dirname, "../../sdk/js/src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/auto": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/app": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/agent": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/file": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/session": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/provider": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/project": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/experimental": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/path": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/mcp": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/lsp": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/formatter": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/config": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/vcs": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/find": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
    },
  },
})
