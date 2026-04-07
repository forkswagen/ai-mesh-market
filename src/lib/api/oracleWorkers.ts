import { apiUrl } from "@/lib/api/env";

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
  const r = await fetch(apiUrl("/api/agent/oracle-workers"));
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  return r.json() as Promise<OracleWorkersStats>;
}
