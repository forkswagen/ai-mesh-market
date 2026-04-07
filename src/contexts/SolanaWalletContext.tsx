import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getSolanaRpcUrl } from "@/lib/solana/rpc";
import type { InjectedSolana } from "@/types/window-solana";
import { resolvePhantomProvider } from "@/types/window-solana";
import { toast } from "sonner";

type SolanaWalletContextValue = {
  /** Подключён Phantom (или совместимый) */
  connected: boolean;
  /** Base58 только при активном подключении */
  address: string | null;
  solBalance: number | null;
  balanceLoading: boolean;
  connecting: boolean;
  hasPhantom: boolean;
  /** Публичный ключ из VITE_DEPAI_DEV_WALLET — только для подсказок / API, не «подключение» */
  devWalletPubkey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  /** Подпись произвольного UTF-8 текста → Base64 (64 байта detached). */
  signUtf8Message: (message: string) => Promise<string>;
};

const SolanaWalletContext = createContext<SolanaWalletContextValue | null>(null);

function getPhantom(): InjectedSolana | undefined {
  return resolvePhantomProvider();
}

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  /** Расширение инжектит провайдер асинхронно — без повторной проверки hasPhantom залипает false. */
  const [hasPhantom, setHasPhantom] = useState(() =>
    typeof window !== "undefined" ? Boolean(resolvePhantomProvider()) : false,
  );

  const devWalletPubkey = import.meta.env.VITE_DEPAI_DEV_WALLET?.trim() || null;

  useEffect(() => {
    const refresh = () => setHasPhantom(Boolean(resolvePhantomProvider()));
    refresh();
    const id = window.setInterval(refresh, 250);
    const stop = window.setTimeout(() => window.clearInterval(id), 10_000);
    window.addEventListener("load", refresh);
    window.addEventListener("phantom#initialized", refresh);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
      window.removeEventListener("load", refresh);
      window.removeEventListener("phantom#initialized", refresh);
    };
  }, []);

  const fetchBalance = useCallback(async (pubkey: string) => {
    setBalanceLoading(true);
    try {
      const conn = new Connection(getSolanaRpcUrl(), "confirmed");
      const lamports = await conn.getBalance(new PublicKey(pubkey));
      setSolBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setSolBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) {
      setSolBalance(null);
      return;
    }
    await fetchBalance(address);
  }, [address, fetchBalance]);

  useEffect(() => {
    void refreshBalance();
  }, [address, refreshBalance]);

  useEffect(() => {
    const p = getPhantom();
    if (!p) return;
    const onAcct = (pk: { toBase58(): string } | undefined) => {
      setAddress(pk ? pk.toBase58() : null);
    };
    p.on?.("accountChanged", onAcct);
    return () => p.removeListener?.("accountChanged", onAcct);
  }, [hasPhantom]);

  useEffect(() => {
    const p = getPhantom();
    if (p?.publicKey) setAddress(p.publicKey.toBase58());
  }, [hasPhantom]);

  useEffect(() => {
    const p = getPhantom();
    if (!p) return;
    p.connect({ onlyIfTrusted: true })
      .then((r) => setAddress(r.publicKey.toBase58()))
      .catch(() => {});
  }, [hasPhantom]);

  const connect = useCallback(async () => {
    const p = getPhantom();
    if (!p) {
      toast.error("Установите Phantom", { description: "https://phantom.app" });
      return;
    }
    setConnecting(true);
    try {
      const { publicKey } = await p.connect();
      setAddress(publicKey.toBase58());
      toast.success("Кошелёк подключён");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось подключить");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const p = getPhantom();
    if (p) {
      try {
        await p.disconnect();
      } catch {
        /* ignore */
      }
    }
    setAddress(null);
    setSolBalance(null);
  }, []);

  const signUtf8Message = useCallback(async (message: string) => {
    const p = getPhantom();
    if (!p?.signMessage) {
      throw new Error("Кошелёк не поддерживает signMessage (нужен Phantom)");
    }
    const enc = new TextEncoder();
    const { signature } = await p.signMessage({ message: enc.encode(message) });
    let bin = "";
    signature.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  }, []);

  const connected = Boolean(address);

  const value = useMemo<SolanaWalletContextValue>(
    () => ({
      connected,
      address,
      solBalance,
      balanceLoading,
      connecting,
      hasPhantom,
      devWalletPubkey,
      connect,
      disconnect,
      refreshBalance,
      signUtf8Message,
    }),
    [
      connected,
      address,
      solBalance,
      balanceLoading,
      connecting,
      hasPhantom,
      devWalletPubkey,
      connect,
      disconnect,
      refreshBalance,
      signUtf8Message,
    ],
  );

  return <SolanaWalletContext.Provider value={value}>{children}</SolanaWalletContext.Provider>;
}

export function useSolanaWallet(): SolanaWalletContextValue {
  const ctx = useContext(SolanaWalletContext);
  if (!ctx) throw new Error("useSolanaWallet must be used within SolanaWalletProvider");
  return ctx;
}
