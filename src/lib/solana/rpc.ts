/** RPC для кошелька и чтения баланса (по умолчанию devnet, как escrow). */
export function getSolanaRpcUrl(): string {
  return import.meta.env.VITE_SOLANA_RPC_URL?.trim() || "https://api.devnet.solana.com";
}

/** Query-параметр cluster для solscan.io по текущему RPC. */
export function solscanClusterQuery(): string {
  const u = getSolanaRpcUrl().toLowerCase();
  if (u.includes("mainnet") || u.includes("helius-mainnet")) return "cluster=mainnet";
  if (u.includes("testnet")) return "cluster=testnet";
  return "cluster=devnet";
}

export function solscanAccountUrl(address: string): string {
  return `https://solscan.io/account/${address}?${solscanClusterQuery()}`;
}
