export type InjectedSolana = {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58(): string } }>;
  disconnect: () => Promise<void>;
  /** Phantom: подпись UTF-8 сообщения (SIWS / регистрация агента). */
  signMessage?: (opts: { message: Uint8Array }) => Promise<{ signature: Uint8Array }>;
  on?: (event: "accountChanged", handler: (pubkey: { toBase58(): string } | undefined) => void) => void;
  removeListener?: (
    event: "accountChanged",
    handler: (pubkey: { toBase58(): string } | undefined) => void,
  ) => void;
};

declare global {
  interface Window {
    solana?: InjectedSolana;
  }
}

export {};
