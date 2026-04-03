import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { authApi, profileApi, setToken, clearToken, type ProfileUser } from "@/lib/api";
import { toast } from "sonner";

interface AuthState {
  user: ProfileUser | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Try to load profile on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem("sol_toloka_token");
    if (token) {
      profileApi.me().then(setUser).catch(() => {
        clearToken();
      });
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Check for Phantom (Solana) wallet
      const phantom = (window as any).solana;
      if (!phantom?.isPhantom) {
        toast.error("Установите Phantom кошелёк для подключения");
        return;
      }

      const resp = await phantom.connect();
      const wallet = resp.publicKey.toString();

      // Step 1: Get challenge
      const { challenge } = await authApi.challenge(wallet);

      // Step 2: Sign message
      const encodedMessage = new TextEncoder().encode(challenge);
      const signedMessage = await phantom.signMessage(encodedMessage, "utf8");
      const signature = btoa(String.fromCharCode(...signedMessage.signature));

      // Step 3: Verify and get JWT
      const { access_token } = await authApi.verify({
        wallet,
        signature,
        message: challenge,
        is_provider: true,
      });

      setToken(access_token);

      // Step 4: Load profile
      const profile = await profileApi.me();
      setUser(profile);
      toast.success("Кошелёк подключён!");
    } catch (err: any) {
      console.error("Auth error:", err);
      toast.error(err.message || "Ошибка подключения кошелька");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearToken();
    setUser(null);
    toast.info("Кошелёк отключён");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isConnecting, isAuthenticated: !!user, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}
