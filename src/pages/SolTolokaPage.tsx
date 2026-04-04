import { useQuery } from "@tanstack/react-query";
import { Cable, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { soltolokaApiUrl } from "@/lib/api/soltoloka";

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
  const r = await fetch(soltolokaApiUrl(path));
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function SolTolokaPage() {
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
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Cable className="h-7 w-7 text-primary" />
          SolToloka
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Связка с Python-бэкендом SolToloka (ноды, WebSocket, матчмейкинг). Локально:{" "}
          <code className="bg-muted px-1 rounded text-xs">npm run soltoloka:db</code>, затем в{" "}
          <code className="bg-muted px-1 rounded text-xs">soltoloka-backend/</code>{" "}
          <code className="bg-muted px-1 rounded text-xs">uvicorn</code> на :8000; фронт ходит через прокси{" "}
          <code className="bg-muted px-1 rounded text-xs">/st → :8000</code>.
        </p>
      </div>

      <div
        className={`surface p-4 border text-sm ${
          rootQ.isError ? "border-destructive/40 bg-destructive/5" : rootQ.isSuccess ? "border-green-500/30 bg-green-500/5" : "border-border"
        }`}
      >
        {rootQ.isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Проверка API…
          </div>
        )}
        {rootQ.isError && (
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">SolToloka backend недоступен</p>
              <p className="text-xs mt-1 opacity-90">{(rootQ.error as Error).message}</p>
              <p className="text-xs mt-2 text-muted-foreground">
                Подними Postgres/Redis (<code className="bg-muted px-1 rounded">npm run soltoloka:db</code>), затем{" "}
                <code className="bg-muted px-1 rounded">cd soltoloka-backend && uvicorn app.main:app --reload --port 8000</code>.
              </p>
            </div>
          </div>
        )}
        {rootQ.isSuccess && rootQ.data && (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground font-medium">API отвечает</p>
              <p className="text-muted-foreground text-xs mt-1">{rootQ.data.message}</p>
            </div>
          </div>
        )}
      </div>

      <div className="surface p-4 border border-border">
        <h2 className="font-heading font-semibold text-sm mb-3">Ноды (из БД + WebSocket)</h2>
        {nodesQ.isLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка…
          </p>
        )}
        {nodesQ.isError && <p className="text-sm text-destructive">{(nodesQ.error as Error).message}</p>}
        {nodesQ.isSuccess && nodesQ.data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Нод пока нет. Зарегистрируй ноду через API (владелец) и подними{" "}
            <code className="bg-muted px-1 rounded text-xs">soltoloka-agent</code> с LM Studio :1234.
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
          Репозитории:{" "}
          <a
            href="https://github.com/forkswagen/soltoloka-backend"
            className="text-primary inline-flex items-center gap-1 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            soltoloka-backend <ExternalLink className="h-3 w-3" />
          </a>
          ,{" "}
          <a
            href="https://github.com/forkswagen/soltoloka-agent"
            className="text-primary inline-flex items-center gap-1 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            soltoloka-agent <ExternalLink className="h-3 w-3" />
          </a>
        </p>
        <p>Прод: задайте VITE_SOLToloka_API_URL и пересоберите фронт.</p>
      </div>
    </div>
  );
}
