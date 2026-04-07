/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL Node-оркестратора (`server/`). В dev, если пусто — http://127.0.0.1:8787.
   */
  readonly VITE_API_BASE_URL?: string;
  /** Опционально: отдельный SolToloka FastAPI только для страницы `/soltoloka`. */
  readonly VITE_SOLToloka_API_URL?: string;
  /** Solana RPC для баланса кошелька (по умолчанию devnet). */
  readonly VITE_SOLANA_RPC_URL?: string;
  /** Кошелёк для dev JWT (challenge/verify). */
  readonly VITE_DEPAI_DEV_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
