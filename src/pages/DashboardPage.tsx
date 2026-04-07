import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Zap,
  Shield,
  Bot,
  Loader2,
  Database,
  AlertCircle,
  CheckCircle2,
  Play,
  Server,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  frontendUrlAsOrchestratorApiMessage,
  missingViteApiBaseUrlMessage,
  orchestratorConnectionHint,
} from "@/lib/api/connectionHints";
import { isOrchestratorOriginConfigured, wrongOrchestratorUrlMessage } from "@/lib/api/backendOrigin";
import { fetchApiHealth } from "@/lib/api/health";
import { fetchOracleWorkersStats } from "@/lib/api/oracleWorkers";
import { DATA_ARBITER_PROGRAM_ID } from "@/lib/solana/escrow";

const stats = [
  { label: "Balance", value: "1,250 NXS", change: "+12.5%", up: true, icon: Zap },
  { label: "Active tasks", value: "8", change: "+3", up: true, icon: TrendingUp },
  { label: "Completed", value: "147", change: "this week", up: true, icon: Shield },
  { label: "Reputation", value: "4.87", change: "top 5%", up: true, icon: Bot },
];

const recentTasks = [
  { title: "CAPTCHA batch #4421", type: "CAPTCHA", reward: "12 NXS", status: "in_progress", time: "2m ago" },
  { title: "TTS eval — RU model", type: "TTS/STT", reward: "45 NXS", status: "completed", time: "14m ago" },
  { title: "Medical imaging annotation", type: "Annotation", reward: "180 NXS", status: "in_progress", time: "1h ago" },
  { title: "Cloudflare bypass x200", type: "CAPTCHA", reward: "8 NXS", status: "pending", time: "2h ago" },
  { title: "STT QA EN/DE", type: "TTS/STT", reward: "65 NXS", status: "completed", time: "3h ago" },
];

const statusColors: Record<string, string> = {
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};
const statusLabels: Record<string, string> = {
  in_progress: "In progress",
  completed: "Completed",
  pending: "Pending",
};

const activity = [
  { text: "Escrow released: 45 NXS for TTS evaluation", time: "14 min" },
  { text: "AI Judge: task #4398 — 100% complete", time: "28 min" },
  { text: "New dataset available: Speech-RU v3", time: "1h" },
  { text: "GPU rental finished: 4.2 GPU-hrs", time: "2h" },
  { text: "Dispute rejected for task #4305", time: "5h" },
];

export default function DashboardPage() {
  const wrongRpcUrl = wrongOrchestratorUrlMessage();
  const orchestratorReady = isOrchestratorOriginConfigured();
  const configBannerText =
    wrongRpcUrl || frontendUrlAsOrchestratorApiMessage() || (!orchestratorReady ? missingViteApiBaseUrlMessage() : "");

  const healthQ = useQuery({
    queryKey: ["api", "health"],
    queryFn: fetchApiHealth,
    enabled: orchestratorReady,
    retry: 1,
    staleTime: 30_000,
  });
  const oracleHostsQ = useQuery({
    queryKey: ["orchestrator", "oracle-workers"],
    queryFn: fetchOracleWorkersStats,
    enabled: orchestratorReady && healthQ.isSuccess,
    refetchInterval: 8_000,
    staleTime: 4_000,
    retry: 1,
  });

  return (
    <div className="p-6 space-y-6">
      {configBannerText && (
        <div className="surface p-4 border border-amber-500/35 bg-amber-500/5 flex gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{configBannerText}</p>
        </div>
      )}

      <div
        className={`surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border ${
          !orchestratorReady
            ? "border-border bg-muted/20"
            : healthQ.isError
              ? "border-destructive/40 bg-destructive/5"
              : healthQ.isSuccess
                ? "border-green-500/25 bg-green-500/5"
                : "border-border"
        }`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">API (Node orchestrator)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Home — demo numbers in the UI. <code className="bg-muted px-1 rounded">/health</code> hits{" "}
              <strong className="text-foreground/90">server/</strong> (
              <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code>, in dev — <code className="bg-muted px-1 rounded">:8787</code>
              ). Live escrow —{" "}
              <Link to="/escrow" className="text-primary hover:underline">
                AI Escrow
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-sm">
          {!orchestratorReady && (
            <>
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs max-w-[min(100%,320px)] leading-snug">
                <code className="bg-muted px-1 rounded">/health</code> is skipped — see yellow box above.
              </span>
            </>
          )}
          {orchestratorReady && healthQ.isLoading && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Checking…</span>
            </>
          )}
          {orchestratorReady && healthQ.isError && (
            <>
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-destructive text-xs max-w-[min(100%,420px)] leading-snug">
                Cannot reach orchestrator. {(healthQ.error as Error)?.message}{" "}
                {!(healthQ.error as Error)?.message?.includes("VITE_API_BASE_URL") && orchestratorConnectionHint()}
              </span>
            </>
          )}
          {orchestratorReady && healthQ.isSuccess && healthQ.data && (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-foreground/90 text-xs">
                {healthQ.data.app ?? healthQ.data.status ?? "ok"}
                {healthQ.data.env ? (
                  <>
                    {" "}
                    · <span className="text-muted-foreground">{healthQ.data.env}</span>
                  </>
                ) : null}
              </span>
              {oracleHostsQ.isSuccess && oracleHostsQ.data && (
                <Link
                  to="/escrow"
                  title="oracle-worker processes with LM Studio (GET /api/agent/oracle-workers)"
                  className="inline-flex ml-1"
                >
                  <Badge
                    variant="outline"
                    className={
                      oracleHostsQ.data.connected > 0
                        ? "border-cyan-500/35 text-cyan-400 gap-1 text-[10px] h-6 cursor-pointer hover:bg-muted/50"
                        : "border-border text-muted-foreground gap-1 text-[10px] h-6 cursor-pointer hover:bg-muted/50"
                    }
                  >
                    <Server className="h-3 w-3" />
                    LM hosts: {oracleHostsQ.data.connected}
                  </Badge>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="surface p-4 border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Main demo: AI Escrow</p>
          <p className="text-xs text-muted-foreground mt-1">
            Needs <code className="bg-muted px-1 rounded">server/.env</code> with keys and SOL on devnet. From repo root:{" "}
            <code className="bg-muted px-1 rounded">npm run dev</code>.
          </p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link to="/escrow">
            <Play className="h-4 w-4" />
            Open demo
          </Link>
        </Button>
      </div>

      <div className="surface p-4 border-primary/25 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Escora · Agent Economy · AI-oracled escrow (Solana)</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
            data_arbiter (devnet): {DATA_ARBITER_PROGRAM_ID.toBase58()}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/escrow">Escrow & contract →</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Escora overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tasks, SolToloka, AI agents — and escrow where the oracle signs settlement on devnet (AI Escrow section)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="surface p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-2">
              <span className="font-heading text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-primary flex items-center gap-0.5 mb-1">
                {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 surface">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground">Recent tasks</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" asChild>
              <Link to="/tasks">All tasks →</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentTasks.map((task, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground flex-shrink-0">
                      {task.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{task.time}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-sm font-medium text-primary">{task.reward}</span>
                  <Badge variant="outline" className={`text-[10px] ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="surface">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-semibold text-foreground">Activity</h2>
          </div>
          <div className="p-2">
            {activity.map((a, i) => (
              <div key={i} className="px-3 py-3 rounded-md hover:bg-muted/30 transition-colors cursor-default">
                <p className="text-sm text-foreground/90 leading-snug">{a.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.time} ago</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
