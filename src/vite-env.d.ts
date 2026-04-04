/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Публичный URL SolToloka FastAPI (прод). Локально пусто → префикс /st через Vite. */
  readonly VITE_SOLToloka_API_URL?: string;
  /** Кошелёк для dev JWT (challenge/verify); должен совпадать с NEXUS_DEMO_BUYER в nexus_bridge. */
  readonly VITE_DEPAI_DEV_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
