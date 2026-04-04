import { apiBase } from "./env";

const STORAGE_KEY = "depai_access_token";

/** Dev: кошелёк для challenge/verify (на бэке при SOLANA_MOCK подпись не проверяется). */
const devWallet = () => import.meta.env.VITE_DEPAI_DEV_WALLET?.trim() || "";

export function getDepaiAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearDepaiAccessToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Получить JWT для /api/deals (опционально). Без VITE_DEPAI_DEV_WALLET список будет пустым. */
export async function ensureDepaiToken(): Promise<string | null> {
  const w = devWallet();
  if (!w) return null;
  const existing = getDepaiAccessToken();
  if (existing) return existing;

  const base = apiBase();
  const ch = await fetch(`${base}/api/v1/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet: w }),
  });
  if (!ch.ok) return null;
  const { challenge } = (await ch.json()) as { challenge: string };

  const v = await fetch(`${base}/api/v1/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet: w,
      message: challenge,
      signature: "dev-mock-signature",
      is_provider: false,
    }),
  });
  if (!v.ok) return null;
  const { access_token } = (await v.json()) as { access_token: string };
  localStorage.setItem(STORAGE_KEY, access_token);
  return access_token;
}

export function authHeaders(): Record<string, string> {
  const t = getDepaiAccessToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}
