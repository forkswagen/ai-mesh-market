import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Use Vite default port to avoid clashing with another local app on :8080
    // (e.g. a second Vite on the same machine: `localhost` can resolve to IPv6 first).
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: false,
    },
    // Relative /api from the dev server → local orchestrator.
    proxy: {
      "/api/orchestrator-proxy": {
        target: process.env.ORCHESTRATOR_UPSTREAM_URL || "http://127.0.0.1:8787",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/orchestrator-proxy/, "") || "/",
      },
      "/api/soltoloka-proxy": {
        target: process.env.SOLTOLOKA_UPSTREAM_URL || "https://soltoloka-backend.vercel.app",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/soltoloka-proxy/, "") || "/",
      },
      "/api": { target: "http://127.0.0.1:8787", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8787", changeOrigin: true },
      "/ws": { target: "http://127.0.0.1:8787", ws: true, changeOrigin: true },
      "/ws/agent": { target: "http://127.0.0.1:8787", ws: true, changeOrigin: true },
      "/ws/oracle-worker": { target: "http://127.0.0.1:8787", ws: true, changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
