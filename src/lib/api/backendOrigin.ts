/**
 * Основной бэкенд фронта — Node-оркестратор (`server/`: escrow, задачи, LM, WebSocket).
 *
 * - `vite` dev: без `VITE_API_BASE_URL` → `http://127.0.0.1:8787`.
 * - `vite build` + открытие с localhost / 127.0.0.1 (в т.ч. preview): тот же localhost-оркестратор.
 * - Продакшен-деплой (Vercel и т.д.) без переменной: **пустая строка** — нельзя молча слать браузер на loopback.
 *   Задайте `VITE_API_BASE_URL` на публичный URL `server/` и пересоберите фронт.
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
  if (explicit) return explicit;

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

/** false на прод-версии сайта без VITE_API_BASE_URL — нужен Redeploy с env. */
export function isOrchestratorOriginConfigured(): boolean {
  return Boolean(getBackendOrigin());
}

