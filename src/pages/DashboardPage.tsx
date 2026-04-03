import { ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Shield, Bot, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileStats, useTasks, useNotifications } from "@/hooks/use-api";

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};
const statusLabels: Record<string, string> = {
  open: "Открыта",
  in_progress: "В работе",
  completed: "Завершено",
  pending: "Ожидает",
};

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { data: tasks, isLoading: tasksLoading } = useTasks("open");
  const { data: notifications } = useNotifications();

  const statCards = [
    {
      label: "Заработано (SOL)",
      value: stats ? `${stats.total_earned}` : "—",
      change: "",
      up: true,
      icon: Zap,
    },
    {
      label: "Активные сделки",
      value: stats?.tasks_created?.toString() ?? "—",
      change: "",
      up: true,
      icon: TrendingUp,
    },
    {
      label: "Завершено Judge",
      value: stats?.tasks_completed?.toString() ?? "—",
      change: "",
      up: true,
      icon: Shield,
    },
    {
      label: "Репутация",
      value: stats?.reputation?.toFixed(2) ?? "—",
      change: "",
      up: true,
      icon: Bot,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {!isAuthenticated && (
        <div className="surface p-4 border-primary/30 bg-primary/5 text-center">
          <p className="text-sm text-foreground">Подключите кошелёк для доступа ко всем функциям платформы</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Обзор DataArbiter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-эскроу для сделок с датасетами на Solana: заморозка → загрузка → Judge → выплата
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link to="/datasets">К датасетам</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="surface p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-2">
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <span className="font-heading text-2xl font-bold text-foreground">{s.value}</span>
                  {s.change ? (
                    <span className="text-xs text-primary flex items-center gap-0.5 mb-1">
                      {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {s.change}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 surface">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground">Последние сделки</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" asChild>
              <Link to="/escrow">Все в Escrow →</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {tasksLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tasks && tasks.length > 0 ? (
              tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground flex-shrink-0">
                        {task.task_type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.created_at).toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-sm font-medium text-primary">{task.total_budget} SOL</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[task.status] || ""}`}>
                      {statusLabels[task.status] || task.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">Нет сделок</div>
            )}
          </div>
        </div>

        <div className="surface">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-semibold text-foreground">Активность</h2>
          </div>
          <div className="p-2">
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="px-3 py-3 rounded-md hover:bg-muted/30 transition-colors cursor-default">
                  <p className="text-sm text-foreground/90 leading-snug">{n.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">Нет активности</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
