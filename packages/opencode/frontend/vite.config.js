import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// SDK server URL - use 127.0.0.1 for more reliable connection in Codespaces
const SDK_SERVER_URL = "http://127.0.0.1:4096"

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
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/agent": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/file": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/session": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/provider": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/project": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/experimental": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/path": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/mcp": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/lsp": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/formatter": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/config": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/vcs": {
        target: SDK_SERVER_URL,
        changeOrigin: true,
      },
      "/find": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
    },
  },
})
