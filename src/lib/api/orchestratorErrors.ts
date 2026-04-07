import { getOrchestratorHttpBase } from "./backendOrigin";

/** Typical Express 404 HTML ("Cannot GET …") when server/ is outdated or wrong host. */
export function formatOrchestratorHttpError(path: string, status: number, body: string): string {
  const snippet = body.replace(/\s+/g, " ").trim().slice(0, 400);
  const looksHtml = /<!DOCTYPE|<html/i.test(body) || body.includes("Cannot GET");
  if (looksHtml || status === 404) {
    const base =
      getOrchestratorHttpBase() ||
      "(set VITE_API_BASE_URL, or api/escora + Function env, or ORCHESTRATOR_UPSTREAM_URL + VITE_ORCHESTRATOR_VIA_PROXY=1)";
    const meta = `${base}/api/meta`;
    return (
      `HTTP ${status} for ${path}. Server returned HTML — usually an old orchestrator build without this route, or wrong host.\n\n` +
      `What to do:\n` +
      `1) Redeploy the Node orchestrator from this repo (service root = server/ folder, not the whole monorepo).\n` +
      `2) Open ${meta} in the browser — expect apiRevision and in agentEndpoints a line for «GET ${path}».\n` +
      `3) Vercel monolith: without VITE_API_BASE_URL the base is this origin; check rewrites and Function env. Separate server/: set VITE_API_BASE_URL to that URL.\n\n` +
      (snippet ? `Response fragment: ${snippet}` : "")
    );
  }
  return snippet || `HTTP ${status}`;
}
