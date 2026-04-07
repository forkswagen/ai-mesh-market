import { useQuery } from "@tanstack/react-query";
import { Cable, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { soltolokaConnectionHint } from "@/lib/api/connectionHints";
import { soltolokaApiUrl, soltolokaDocsUrl, soltolokaOrigin } from "@/lib/api/soltoloka";

type SoltolokaRoot = { message?: string };
type ComputeNode = {
  id: number;
  node_id: string;
  gpu_name: string | null;
  vram_total: number | null;
  status: string;
  price_per_token: number;
  latency: number | null;
};

async function fetchJson<T>(path: string): Promise<T> {
  const url = soltolokaApiUrl(path);
  let r: Response;
  try {
    r = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `${msg} · request: ${url}\n\n` +
        "Public soltoloka-backend.vercel.app may be down or block CORS. " +
        "Deploy your own FastAPI (forkswagen/soltoloka-backend) and set VITE_SOLToloka_API_URL, or use /api/soltoloka-proxy (without VITE_SOLToloka_API_URL).",
    );
  }
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

/** SolToloka nodes (separate FastAPI) — same Agents area, different backend. */
export function SolTolokaPanel() {
  const rootQ = useQuery({
    queryKey: ["soltoloka", "root"],
    queryFn: () => fetchJson<SoltolokaRoot>("/"),
    retry: 1,
    staleTime: 10_000,
  });

  const nodesQ = useQuery({
    queryKey: ["soltoloka", "nodes"],
    queryFn: () => fetchJson<ComputeNode[]>("/api/v1/compute/nodes"),
    retry: 1,
    staleTime: 10_000,
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        SolToloka compute nodes and WebSocket agents. Docs:{" "}
        <a className="text-primary hover:underline" href={soltolokaDocsUrl()} target="_blank" rel="noreferrer">
          OpenAPI
        </a>
        . API: <code className="bg-muted px-1 rounded text-xs break-all">{soltolokaOrigin()}</code>
      </p>

      <div
        className={`surface p-4 border text-sm ${
          rootQ.isError ? "border-destructive/40 bg-destructive/5" : rootQ.isSuccess ? "border-green-500/30 bg-green-500/5" : "border-border"
        }`}
      >
        {rootQ.isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking SolToloka API…
          </div>
        )}
        {rootQ.isError && (
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">SolToloka backend unreachable</p>
              <p className="text-xs mt-1 opacity-90 whitespace-pre-wrap">{(rootQ.error as Error).message}</p>
              <p className="text-xs mt-2 text-muted-foreground">{soltolokaConnectionHint()}</p>
            </div>
          </div>
        )}
        {rootQ.isSuccess && rootQ.data && (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground font-medium">SolToloka API is up</p>
              <p className="text-muted-foreground text-xs mt-1">{rootQ.data.message}</p>
            </div>
          </div>
        )}
      </div>

      <div className="surface p-4 border border-border">
        <h2 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
          <Cable className="h-4 w-4 text-primary" />
          Nodes (DB + WebSocket)
        </h2>
        {nodesQ.isLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        )}
        {nodesQ.isError && <p className="text-sm text-destructive whitespace-pre-wrap">{(nodesQ.error as Error).message}</p>}
        {nodesQ.isSuccess && nodesQ.data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No nodes yet. Register: POST <code className="bg-muted px-1 rounded text-xs">{soltolokaApiUrl("/api/v1/compute/register")}</code> and run{" "}
            <code className="bg-muted px-1 rounded text-xs">soltoloka-agent</code> + LM Studio.
          </p>
        )}
        {nodesQ.isSuccess && nodesQ.data.length > 0 && (
          <ul className="space-y-2">
            {nodesQ.data.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-2 text-sm border border-border rounded-md p-3">
                <span className="font-mono text-xs">{n.node_id}</span>
                <Badge variant={n.status === "online" ? "default" : "secondary"}>{n.status}</Badge>
                <span className="text-muted-foreground">{n.gpu_name ?? "—"}</span>
                {n.vram_total != null && <span className="text-muted-foreground">{n.vram_total} GB VRAM</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <a href="https://github.com/forkswagen/soltoloka-backend" className="text-primary inline-flex items-center gap-1 hover:underline" target="_blank" rel="noreferrer">
            soltoloka-backend <ExternalLink className="h-3 w-3" />
          </a>
          ,{" "}
          <a href="https://github.com/forkswagen/soltoloka-agent" className="text-primary inline-flex items-center gap-1 hover:underline" target="_blank" rel="noreferrer">
            soltoloka-agent <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </div>
  );
}
