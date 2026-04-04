export type InjectedSolana = {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58(): string } }>;
  disconnect: () => Promise<void>;
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
