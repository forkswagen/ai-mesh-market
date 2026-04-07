import { apiUrl } from "./env";
import { authHeaders, ensureDepaiToken } from "./depaiAuth";

/** Orchestrator-совместимые ручки на depai-backend (см. app/api/nexus_bridge.py; legacy имя модуля). */
async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.error || j.detail || JSON.stringify(j);
  } catch {
    return await res.text();
  }
}

export type OrchestratorDeal = {
  id: string;
  deal_id: number;
  buyer: string;
  seller: string;
  amount_lamports: number;
  expected_hash_hex: string | null;
  state: string;
  init_sig: string | null;
  deposit_sig: string | null;
  submit_sig: string | null;
  judge_sig: string | null;
  verdict: number | null;
  reason: string | null;
  error: string | null;
  created_at: number;
};

export async function fetchDealsList(): Promise<{ deals: OrchestratorDeal[] }> {
  await ensureDepaiToken();
  const r = await fetch(apiUrl("/api/deals"), { headers: { ...authHeaders() } });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function fetchDeal(id: string): Promise<OrchestratorDeal> {
  await ensureDepaiToken();
  const r = await fetch(apiUrl(`/api/deals/${id}`), { headers: { ...authHeaders() } });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export type DemoSeededResult = {
  id: string;
  state: string;
  verdict?: boolean;
  reason?: string;
  signatures?: { sigInit: string; sigDep: string; sigSub: string; sigJudge: string; escrowPda: string };
  error?: string;
};

export async function postDemoSeeded(body?: Record<string, unknown>): Promise<DemoSeededResult> {
  const r = await fetch(apiUrl("/api/demo/seeded"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || data.detail || (typeof data === "object" && data && "message" in data ? String(data.message) : r.statusText));
  return data;
}
