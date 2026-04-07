import { formatOrchestratorHttpError } from "@/lib/api/orchestratorErrors";
import { orchestratorFetch } from "@/lib/api/orchestratorFetch";

export type LiveAgentRow = {
  logicalId: string;
  sessionId: string;
  name: string;
  accepting: boolean;
  busy: boolean;
};

export type OracleWorkersStats = {
  ok: boolean;
  connected: number;
  busy: number;
  workerIds: string[];
  agents?: LiveAgentRow[];
};

export async function fetchOracleWorkersStats(): Promise<OracleWorkersStats> {
  const r = await orchestratorFetch("/api/agent/oracle-workers");
  const t = await r.text();
  if (!r.ok) {
    throw new Error(formatOrchestratorHttpError("/api/agent/oracle-workers", r.status, t));
  }
  try {
    return JSON.parse(t) as OracleWorkersStats;
  } catch {
    throw new Error(formatOrchestratorHttpError("/api/agent/oracle-workers", r.status, t));
  }
}
