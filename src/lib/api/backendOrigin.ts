/**
 * Primary frontend backend — Node orchestrator (`server/`: escrow, tasks, LM, WebSocket).
 *
 * - `vite` dev: without `VITE_API_BASE_URL` → `http://127.0.0.1:8787`.
 * - `vite build` + opening localhost / 127.0.0.1 (incl. preview): same localhost orchestrator.
 * - Production on the **same Vercel project** as `api/escora` (rewrites `/health`, `/api/*` → `createApp`):
 *   without `VITE_API_BASE_URL`, REST uses the same `window.location.origin`.
 * - Or explicitly: `VITE_API_BASE_URL` pointing at a public `server/` URL (Railway, etc.) and rebuild.
 * - Optional legacy: external orchestrator + `ORCHESTRATOR_UPSTREAM_URL` and `/api/orchestrator-proxy`.
 */

const LOCAL_NODE_ORCHESTRATOR = "http://127.0.0.1:8787";

/** Public Solana RPC hosts — not the Escora Node orchestrator; often confused with VITE_API_BASE_URL. */
const SOLANA_PUBLIC_RPC_HOSTS = new Set([
  "api.devnet.solana.com",
  "api.mainnet-beta.solana.com",
  "api.testnet.solana.com",
  "api.mainnet.solana.com",
]);

/** Public SolToloka FastAPI for `/soltoloka` only (optional). */
export const DEFAULT_SOLToloka_ORIGIN = "https://soltoloka-backend.vercel.app";

export function normalizeOrigin(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

/** True if the URL looks like a public Solana RPC (must not be used as VITE_API_BASE_URL). */
export function isLikelySolanaPublicRpcOrigin(raw: string): boolean {
  const n = normalizeOrigin(String(raw).trim());
  if (!n) return false;
  try {
    return SOLANA_PUBLIC_RPC_HOSTS.has(new URL(n).hostname);
  } catch {
    return false;
  }
}

/** Message when VITE_API_BASE_URL is an RPC instead of the orchestrator. */
export function wrongOrchestratorUrlMessage(): string {
  const raw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (!raw || !isLikelySolanaPublicRpcOrigin(raw)) return "";
  return (
    `VITE_API_BASE_URL=${JSON.stringify(raw)} points at public Solana RPC, not the Escora Node orchestrator (server/ folder). ` +
    `Set the orchestrator deploy URL (https://… Railway, etc.). Use VITE_SOLANA_RPC_URL separately for Phantom.`
  );
}

/** Base origin of the Node orchestrator (REST, `/health`, `/ws`, `/api/deals`, …). */
export function getBackendOrigin(): string {
  const raw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  const explicit = normalizeOrigin(raw);
  if (explicit && isLikelySolanaPublicRpcOrigin(raw)) {
    if (import.meta.env.DEV) return LOCAL_NODE_ORCHESTRATOR;
    if (typeof window !== "undefined") {
      const h = window.location.hostname;
      if (h === "localhost" || h === "127.0.0.1") {
        return LOCAL_NODE_ORCHESTRATOR;
      }
    }
    return "";
  }
  if (explicit) {
    if (typeof window !== "undefined") {
      try {
        if (new URL(explicit).origin === window.location.origin) return "";
      } catch {
        /* noop */
      }
    }
    return explicit;
  }

  if (import.meta.env.DEV) {
    return LOCAL_NODE_ORCHESTRATOR;
  }

  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return LOCAL_NODE_ORCHESTRATOR;
    }
  }

  return "";
}

/**
 * Production on a public host: orchestrator on the same origin (Vercel `api/escora` + rewrites),
 * without a separate `VITE_API_BASE_URL`.
 */
export function orchestratorEmbeddedSameOrigin(): boolean {
  if (import.meta.env.DEV) return false;
  if (import.meta.env.VITE_ORCHESTRATOR_VIA_PROXY === "1") return false;
  if (String(import.meta.env.VITE_API_BASE_URL || "").trim()) return false;
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return false;
  return true;
}

/**
 * Legacy mode: REST only via `/api/orchestrator-proxy` + `ORCHESTRATOR_UPSTREAM_URL` (external server/).
 * Enable with `VITE_ORCHESTRATOR_VIA_PROXY=1` in the frontend build.
 */
export function orchestratorHttpViaProxy(): boolean {
  if (import.meta.env.DEV) return false;
  if (import.meta.env.VITE_ORCHESTRATOR_VIA_PROXY !== "1") return false;
  if (String(import.meta.env.VITE_API_BASE_URL || "").trim()) return false;
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return false;
  return true;
}

/** HTTP base for the orchestrator: explicit URL, same-origin `api/escora`, or legacy proxy. */
export function getOrchestratorHttpBase(): string {
  const direct = getBackendOrigin();
  if (direct) return direct;
  if (orchestratorHttpViaProxy() && typeof window !== "undefined") {
    return `${window.location.origin}/api/orchestrator-proxy`;
  }
  if (orchestratorEmbeddedSameOrigin() && typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/** Whether an HTTP path to the orchestrator is configured. */
export function isOrchestratorOriginConfigured(): boolean {
  return Boolean(getOrchestratorHttpBase());
}

/** Whether WebSocket can be attempted (same-origin `/ws` on Vercel Serverless may fail). */
export function orchestratorWsConfigured(): boolean {
  if (import.meta.env.VITE_ORCHESTRATOR_WS_URL?.trim()) return true;
  return Boolean(getOrchestratorHttpBase()) || import.meta.env.DEV;
}
