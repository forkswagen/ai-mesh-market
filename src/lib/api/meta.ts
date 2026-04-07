import { apiUrl } from "./env";

export type MetaResponse = {
  ok?: boolean;
  apiRevision?: number;
  app?: string;
  db?: string;
  agentEndpoints?: string[];
};

export async function fetchApiMeta(): Promise<MetaResponse> {
  const r = await fetch(apiUrl("/api/meta"));
  if (!r.ok) throw new Error(`GET /api/meta: ${r.status}`);
  return r.json() as Promise<MetaResponse>;
}
