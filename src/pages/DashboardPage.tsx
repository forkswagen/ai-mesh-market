import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Shield, Bot, Loader2, Database, AlertCircle, CheckCircle2, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orchestratorConnectionHint } from "@/lib/api/connectionHints";
import { fetchApiHealth } from "@/lib/api/health";
import { DATA_ARBITER_PROGRAM_ID } from "@/lib/solana/escrow";

const stats = [
  { label: "Баланс", value: "1,250 NXS", change: "+12.5%", up: true, icon: Zap },
  { label: "Активные задачи", value: "8", change: "+3", up: true, icon: TrendingUp },
  { label: "Выполнено", value: "147", change: "за неделю", up: true, icon: Shield },
  { label: "Репутация", value: "4.87", change: "top 5%", up: true, icon: Bot },
];

const recentTasks = [
  { title: "CAPTCHA пакет #4421", type: "CAPTCHA", reward: "12 NXS", status: "in_progress", time: "2 мин назад" },
  { title: "TTS оценка — RU-модель", type: "TTS/STT", reward: "45 NXS", status: "completed", time: "14 мин назад" },
  { title: "Аннотация мед. снимков", type: "Аннотация", reward: "180 NXS", status: "in_progress", time: "1ч назад" },
  { title: "Cloudflare bypass x200", type: "CAPTCHA", reward: "8 NXS", status: "pending", time: "2ч назад" },
  { title: "STT проверка EN/DE", type: "TTS/STT", reward: "65 NXS", status: "completed", time: "3ч назад" },
];

const statusColors: Record<string, string> = {
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};
const statusLabels: Record<string, string> = {
  in_progress: "В работе",
  completed: "Завершено",
  pending: "Ожидает",
};

const activity = [
  { text: "Escrow разблокирован: 45 NXS за TTS оценку", time: "14 мин" },
  { text: "AI Judge: задача #4398 — выполнено на 100%", time: "28 мин" },
  { text: "Новый датасет доступен: Speech-RU v3", time: "1ч" },
  { text: "GPU аренда завершена: 4.2 GPU-hrs", time: "2ч" },
  { text: "Dispute отклонён по задаче #4305", time: "5ч" },
];

export default function DashboardPage() {
  const healthQ = useQuery({
    queryKey: ["api", "health"],
    queryFn: fetchApiHealth,
    retry: 1,
    staleTime: 30_000,
  });

  return (
    <div className="p-6 space-y-6">
      <div
        className={`surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border ${
          healthQ.isError ? "border-destructive/40 bg-destructive/5" : healthQ.isSuccess ? "border-green-500/25 bg-green-500/5" : "border-border"
        }`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">API (SolToloka backend · Vercel)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Главная — демо-цифры в UI. Проверка <code className="bg-muted px-1 rounded">/health</code> идёт на{" "}
              <strong className="text-foreground/90">forkswagen/soltoloka-backend</strong> (
              <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code> / дефолт в коде). Живой escrow —{" "}
              <Link to="/escrow" className="text-primary hover:underline">
                AI Escrow
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-sm">
          {healthQ.isLoading && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Проверка…</span>
            </>
          )}
          {healthQ.isError && (
            <>
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-destructive text-xs max-w-[min(100%,320px)] leading-snug">
                Нет связи с оркестратором. {orchestratorConnectionHint()}
              </span>
            </>
          )}
          {healthQ.isSuccess && healthQ.data && (
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
            </>
          )}
        </div>
      </div>

      <div className="surface p-4 border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Главное демо: AI Escrow</p>
          <p className="text-xs text-muted-foreground mt-1">
            Нужны <code className="bg-muted px-1 rounded">server/.env</code> с ключами и SOL на devnet. Запуск из корня:{" "}
            <code className="bg-muted px-1 rounded">npm run dev:demo</code>.
          </p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link to="/escrow">
            <Play className="h-4 w-4" />
            Открыть демо
          </Link>
        </Button>
      </div>

      <div className="surface p-4 border-primary/25 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">NexusAI · Agent Economy · AI-oracled escrow (Solana)</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
            data_arbiter (devnet): {DATA_ARBITER_PROGRAM_ID.toBase58()}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/escrow">Эскроу и контракт →</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Обзор NexusAI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tasks, DePIN/GPU, AI-агенты — и escrow, где оркул подписывает settlement на devnet (раздел AI Escrow)
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
            <h2 className="font-heading font-semibold text-foreground">Последние задачи</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" asChild>
              <Link to="/tasks">Все задачи →</Link>
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
            <h2 className="font-heading font-semibold text-foreground">Активность</h2>
          </div>
          <div className="p-2">
            {activity.map((a, i) => (
              <div key={i} className="px-3 py-3 rounded-md hover:bg-muted/30 transition-colors cursor-default">
                <p className="text-sm text-foreground/90 leading-snug">{a.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.time} назад</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
