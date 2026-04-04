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
    // Локальный оркестратор server/ по умолчанию PORT=8787 (см. server/.env.example)
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/health": "http://127.0.0.1:8787",
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
