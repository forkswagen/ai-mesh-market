/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Переопределение URL SolToloka (по умолчанию https://soltoloka-backend.vercel.app). */
  readonly VITE_SOLToloka_API_URL?: string;
  /** Solana RPC для баланса кошелька (по умолчанию devnet). */
  readonly VITE_SOLANA_RPC_URL?: string;
  /** Кошелёк для dev JWT (challenge/verify); должен совпадать с NEXUS_DEMO_BUYER в nexus_bridge. */
  readonly VITE_DEPAI_DEV_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
