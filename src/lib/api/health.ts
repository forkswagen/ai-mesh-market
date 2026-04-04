import { apiBase } from "./env";

export type HealthResponse = { status: string; app: string; env: string };

export async function fetchApiHealth(): Promise<HealthResponse> {
  const r = await fetch(`${apiBase()}/health`);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}
