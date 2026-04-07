import { getOrchestratorHttpBase } from "@/lib/api/backendOrigin";
import { soltolokaOrigin, soltolokaUsesSameOriginProxy } from "@/lib/api/soltoloka";

/**
 * Production build without `VITE_API_BASE_URL` (same copy as in `apiUrl()` to avoid drift).
 */
export function missingViteApiBaseUrlMessage(): string {
  return (
    "No base URL for REST to the orchestrator. Options: " +
    "(1) Vercel: without VITE_API_BASE_URL the frontend uses the same domain (`api/escora` via rewrites) — set DATABASE_URL, BUYER_SECRET_JSON, etc. in the project env for Functions (see server/.env.example), then Redeploy; " +
    "(2) or set VITE_API_BASE_URL to a separate server/ deployment, Production, Redeploy. " +
    "CORS on a separate server/: VITE_DEV_ORIGIN = frontend origin. WebSocket on Vercel may need VITE_ORCHESTRATOR_WS_URL=wss://… to a long-lived server/."
  );
}

/**
 * Previously, VITE_API_BASE_URL equal to the frontend URL was treated as an error. With `api/escora` on the same
 * Vercel project that URL is redundant: `getBackendOrigin` ignores it and REST uses the same origin.
 */
export function frontendUrlAsOrchestratorApiMessage(): string {
  return "";
}

/** Hint when Node orchestrator calls fail (escrow, tasks, health). */
export function orchestratorConnectionHint(): string {
  const base = getOrchestratorHttpBase();
  if (!base) {
    return (
      "Configure orchestrator access: VITE_API_BASE_URL for a separate server/, or deploy with api/escora and Function env (see .env.example). " +
      "Legacy: ORCHESTRATOR_UPSTREAM_URL + VITE_ORCHESTRATOR_VIA_PROXY=1 and /api/orchestrator-proxy."
    );
  }
  return (
    `Check orchestrator ${base} (GET /health). Locally: npm run dev at repo root (Vite + server on :8787). ` +
      "Separate server/: CORS VITE_DEV_ORIGIN = frontend origin. Vercel monolith: secrets in Function env, not VITE_*."
  );
}

/** SolToloka page talks to a separate FastAPI (not the orchestrator). */
export function soltolokaConnectionHint(): string {
  const base = soltolokaOrigin();
  const via = soltolokaUsesSameOriginProxy() ? " (requests via /api/soltoloka-proxy on this domain)" : "";
  return `Check ${base}${via}. Your instance: set VITE_SOLToloka_API_URL and Redeploy; upstream proxy: SOLTOLOKA_UPSTREAM_URL on Vercel (Functions). Escrow orchestrator: with a Vercel monolith you do not need VITE_API_BASE_URL; otherwise use the server/ URL, not a Solana RPC.`;
}
