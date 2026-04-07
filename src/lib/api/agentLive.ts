import type { LiveAgentRow } from "@/lib/api/oracleWorkers";
import { formatOrchestratorHttpError } from "@/lib/api/orchestratorErrors";
import { orchestratorFetch } from "@/lib/api/orchestratorFetch";

export async function fetchLiveAgents(): Promise<LiveAgentRow[]> {
  const r = await orchestratorFetch("/api/agent/live");
  const t = await r.text();
  if (!r.ok) {
    throw new Error(formatOrchestratorHttpError("/api/agent/live", r.status, t));
  }
  try {
    const data = JSON.parse(t) as { ok?: boolean; agents?: LiveAgentRow[] };
    return data.agents ?? [];
  } catch {
    throw new Error(formatOrchestratorHttpError("/api/agent/live", r.status, t));
  }
}
