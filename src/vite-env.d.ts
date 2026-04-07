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
  /** Program ID Verbitto (Anchor) — для PDA и будущих транзакций с кошелька. */
  readonly VITE_VERBITTO_PROGRAM_ID?: string;
  /** Кошелёк для dev JWT (challenge/verify); должен совпадать с NEXUS_DEMO_BUYER в nexus_bridge. */
  readonly VITE_DEPAI_DEV_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
