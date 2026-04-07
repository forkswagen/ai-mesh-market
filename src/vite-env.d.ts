/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL SolToloka FastAPI (Vercel). Если пусто — используется VITE_SOLToloka_API_URL или
   * дефолт https://soltoloka-backend.vercel.app (см. src/lib/api/backendOrigin.ts).
   */
  readonly VITE_API_BASE_URL?: string;
  /** Тот же бэкенд; приоритет второй после VITE_API_BASE_URL. */
  readonly VITE_SOLToloka_API_URL?: string;
  /** Solana RPC для баланса кошелька (по умолчанию devnet). */
  readonly VITE_SOLANA_RPC_URL?: string;
  /**
   * Node-оркестратор (`server/`: `/api/tasks`, escrow, LM и др.). Не FastAPI soltoloka-backend.
   * Устаревший алиас: `VITE_VERBITTO_API_URL`.
   * В dev без переменной используется http://127.0.0.1:8787.
   */
  readonly VITE_ORCHESTRATOR_URL?: string;
  readonly VITE_VERBITTO_API_URL?: string;
  /** Кошелёк для dev JWT (challenge/verify); должен совпадать с NEXUS_DEMO_BUYER в nexus_bridge. */
  readonly VITE_DEPAI_DEV_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
