import { ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Database, Cpu, Shield, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="p-6 space-y-6">
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
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
              Все задачи →
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
