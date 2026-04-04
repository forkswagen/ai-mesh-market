/** RPC для кошелька и чтения баланса (по умолчанию devnet, как escrow). */
export function getSolanaRpcUrl(): string {
  return import.meta.env.VITE_SOLANA_RPC_URL?.trim() || "https://api.devnet.solana.com";
}
