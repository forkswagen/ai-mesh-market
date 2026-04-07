export type InjectedSolana = {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58(): string } }>;
  disconnect: () => Promise<void>;
  /** Phantom: UTF-8 message signature (SIWS / agent registration). */
  signMessage?: (opts: { message: Uint8Array }) => Promise<{ signature: Uint8Array }>;
  on?: (event: "accountChanged", handler: (pubkey: { toBase58(): string } | undefined) => void) => void;
  removeListener?: (
    event: "accountChanged",
    handler: (pubkey: { toBase58(): string } | undefined) => void,
  ) => void;
};

/** Phantom: official provider is often `window.phantom.solana`; `window.solana` may be another wallet. */
export function resolvePhantomProvider(): InjectedSolana | undefined {
  if (typeof window === "undefined") return undefined;
  const fromPhantomNs = window.phantom?.solana;
  if (fromPhantomNs && typeof fromPhantomNs.connect === "function") {
    return fromPhantomNs;
  }
  const s = window.solana;
  if (s?.isPhantom === true && typeof s.connect === "function") {
    return s;
  }
  return undefined;
}

declare global {
  interface Window {
    solana?: InjectedSolana;
    phantom?: { solana?: InjectedSolana };
  }
}

export {};
