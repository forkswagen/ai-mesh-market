/**
 * Основной бэкенд фронта — Node-оркестратор (`server/`: escrow, задачи, LM, WebSocket).
 *
 * - `vite` dev: без `VITE_API_BASE_URL` → `http://127.0.0.1:8787`.
 * - `vite build` + открытие с localhost / 127.0.0.1 (в т.ч. preview): тот же localhost-оркестратор.
 * - Прод на **том же Vercel-проекте**, что и `api/escora` (rewrites `/health`, `/api/*` → `createApp`):
 *   без `VITE_API_BASE_URL` REST идёт на тот же `window.location.origin`.
 * - Либо явно: `VITE_API_BASE_URL` на отдельный публичный URL `server/` (Railway и т.д.) и пересборка.
 * - Опционально устаревший вариант: внешний оркестратор + `ORCHESTRATOR_UPSTREAM_URL` и `/api/orchestrator-proxy`.
 */

const LOCAL_NODE_ORCHESTRATOR = "http://127.0.0.1:8787";

/** Публичные RPC Solana — не Node-оркестратор Escora; частая путаница с VITE_API_BASE_URL. */
const SOLANA_PUBLIC_RPC_HOSTS = new Set([
  "api.devnet.solana.com",
  "api.mainnet-beta.solana.com",
  "api.testnet.solana.com",
  "api.mainnet.solana.com",
]);

/** Публичный SolToloka FastAPI только для страницы `/soltoloka` (опционально). */
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

/** true, если URL похож на публичный Solana RPC (его нельзя ставить в VITE_API_BASE_URL). */
export function isLikelySolanaPublicRpcOrigin(raw: string): boolean {
  const n = normalizeOrigin(String(raw).trim());
  if (!n) return false;
  try {
    return SOLANA_PUBLIC_RPC_HOSTS.has(new URL(n).hostname);
  } catch {
    return false;
  }
}

/** Сообщение при ошибочном VITE_API_BASE_URL (RPC вместо оркестратора). */
export function wrongOrchestratorUrlMessage(): string {
  const raw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (!raw || !isLikelySolanaPublicRpcOrigin(raw)) return "";
  return (
    `VITE_API_BASE_URL=${JSON.stringify(raw)} указывает на публичный RPC Solana, а не на Node-оркестратор Escora (папка server/). ` +
    `Задайте URL деплоя оркестратора (https://… Railway и т.п.). Для RPC Phantom используйте отдельно VITE_SOLANA_RPC_URL.`
  );
}

/** Базовый origin Node-оркестратора (REST, `/health`, `/ws`, `/api/deals`, …). */
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
 * Прод-сборка на публичном хосте: оркестратор на том же origin (Vercel `api/escora` + rewrites),
 * без отдельного `VITE_API_BASE_URL`.
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
 * Устаревший режим: только REST через `/api/orchestrator-proxy` + `ORCHESTRATOR_UPSTREAM_URL` (внешний server/).
 * Включите `VITE_ORCHESTRATOR_VIA_PROXY=1` в сборке фронта.
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

/** База для HTTP к оркестратору: явный URL, same-origin `api/escora`, или legacy-прокси. */
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

/** Есть ли настроенный путь к оркестратору по HTTP. */
export function isOrchestratorOriginConfigured(): boolean {
  return Boolean(getOrchestratorHttpBase());
}

/** Доступен ли заявленный путь для WebSocket (попытка same-origin `/ws` на Vercel может не сработать на Serverless). */
export function orchestratorWsConfigured(): boolean {
  if (import.meta.env.VITE_ORCHESTRATOR_WS_URL?.trim()) return true;
  return Boolean(getOrchestratorHttpBase()) || import.meta.env.DEV;
}

