/**
 * Optional SolToloka FastAPI — `/soltoloka` page only.
 * Main app (escrow, tasks) lives on the Node orchestrator (`getBackendOrigin`).
 *
 * If VITE_SOLToloka_API_URL is unset — requests go via `/api/soltoloka-proxy` (Vercel Function
 * or Vite proxy in dev) to bypass CORS to the public soltoloka backend.
 */
import { DEFAULT_SOLToloka_ORIGIN, normalizeOrigin } from "@/lib/api/backendOrigin";

/** @deprecated use DEFAULT_SOLToloka_ORIGIN */
export const SOLToloka_DEFAULT_ORIGIN = DEFAULT_SOLToloka_ORIGIN;

const PROXY_PREFIX = "/api/soltoloka-proxy";

function explicitSoltolokaOrigin(): string | null {
  return normalizeOrigin(String(import.meta.env.VITE_SOLToloka_API_URL || ""));
}

/** Direct FastAPI URL or empty → then proxy + default upstream. */
export function soltolokaOrigin(): string {
  return explicitSoltolokaOrigin() ?? DEFAULT_SOLToloka_ORIGIN;
}

/** true = same-origin requests via proxy (no VITE_SOLToloka_API_URL). */
export function soltolokaUsesSameOriginProxy(): boolean {
  return !explicitSoltolokaOrigin();
}

export function soltolokaApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const direct = explicitSoltolokaOrigin();
  if (direct) return `${direct}${normalized}`;
  return `${PROXY_PREFIX}${normalized}`;
}

export function soltolokaDocsUrl(): string {
  return `${soltolokaApiUrl("/docs")}`;
}
