/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Node orchestrator URL (`server/`). In dev, if empty — http://127.0.0.1:8787.
   */
  readonly VITE_API_BASE_URL?: string;
  /** Explicit wss://… to orchestrator if same-origin /ws on Vercel is not enough. Appends /ws and /ws/agent paths. */
  readonly VITE_ORCHESTRATOR_WS_URL?: string;
  /** Legacy: "1" = REST only via /api/orchestrator-proxy + ORCHESTRATOR_UPSTREAM_URL on Vercel. */
  readonly VITE_ORCHESTRATOR_VIA_PROXY?: string;
  /** Optional: separate SolToloka FastAPI for `/soltoloka` only. */
  readonly VITE_SOLToloka_API_URL?: string;
  /** Solana RPC for wallet balance (default devnet). */
  readonly VITE_SOLANA_RPC_URL?: string;
  /** Wallet for dev JWT (challenge/verify). */
  readonly VITE_DEPAI_DEV_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
