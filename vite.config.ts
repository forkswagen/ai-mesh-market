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
    // Запасной прокси, если что-то дергает относительные /api с dev-сервера.
    // Основной код использует абсолютные URL → https://soltoloka-backend.vercel.app (см. src/lib/api/backendOrigin.ts).
    proxy: {
      "/api": { target: "https://soltoloka-backend.vercel.app", changeOrigin: true, secure: true },
      "/health": { target: "https://soltoloka-backend.vercel.app", changeOrigin: true, secure: true },
      "/ws": { target: "https://soltoloka-backend.vercel.app", ws: true, changeOrigin: true, secure: true },
      "/ws/agent": { target: "https://soltoloka-backend.vercel.app", ws: true, changeOrigin: true, secure: true },
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
