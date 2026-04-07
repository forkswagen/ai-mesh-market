import { apiUrl } from "./env";

/** Express orchestrator returns status, app, programId — parse loosely. */
export type HealthResponse = { status?: string; app?: string; env?: string; ok?: boolean };

export async function fetchApiHealth(): Promise<HealthResponse> {
  const url = apiUrl("/health");
  let r: Response;
  try {
    r = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("expected pattern") || msg.includes("Failed to fetch")) {
      throw new Error(
        "Cannot reach the orchestrator. Start from repo root: npm run dev (or npm run server:dev), check VITE_API_BASE_URL and CORS.",
      );
    }
    throw e;
  }

  if (!r.ok) throw new Error(`API ${r.status}`);

  const text = await r.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    throw new Error(
      "Response is not JSON (HTML?). Set the Node orchestrator URL in VITE_API_BASE_URL (/health path). " +
        "Do not use api.devnet.solana.com — that is Solana RPC, not Escora server/.",
    );
  }

  if (trimmed.startsWith("{") && trimmed.includes('"jsonrpc"')) {
    throw new Error(
      "Response looks like Solana JSON-RPC: VITE_API_BASE_URL probably points at RPC (api.devnet.solana.com); " +
        "you need the public URL of the Node orchestrator from this repo (server/).",
    );
  }

  try {
    return JSON.parse(text) as HealthResponse;
  } catch {
    throw new Error(
      "/health response is not JSON — expected depai-orchestrator (server/). Check VITE_API_BASE_URL (not Solana RPC).",
    );
  }
}
