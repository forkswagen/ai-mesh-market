import { apiUrl } from "@/lib/api/env";
import type { LiveAgentRow } from "@/lib/api/oracleWorkers";

export async function fetchLiveAgents(): Promise<LiveAgentRow[]> {
  const r = await fetch(apiUrl("/api/agent/live"));
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  const data = (await r.json()) as { ok?: boolean; agents?: LiveAgentRow[] };
  return data.agents ?? [];
}
