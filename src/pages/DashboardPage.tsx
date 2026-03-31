import { ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Shield, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  { label: "В эскроу (SOL)", value: "12.4", change: "+2.1", up: true, icon: Zap },
  { label: "Активные сделки", value: "6", change: "+1", up: true, icon: TrendingUp },
  { label: "Завершено Judge", value: "89", change: "за неделю", up: true, icon: Shield },
  { label: "Репутация", value: "4.87", change: "top 5%", up: true, icon: Bot },
];

const recentDeals = [
  { title: "Speech-RU v3 — QA пары", type: "Датасет", reward: "2.1 SOL", status: "in_progress", time: "2 мин назад" },
  { title: "Med-XRay labeled", type: "Датасет", reward: "5.0 SOL", status: "completed", time: "14 мин назад" },
  { title: "Code completion pairs", type: "Датасет", reward: "1.2 SOL", status: "in_progress", time: "1ч назад" },
  { title: "Video action clips", type: "Датасет", reward: "8.5 SOL", status: "pending", time: "2ч назад" },
  { title: "Multilingual TTS corpus", type: "Датасет", reward: "3.4 SOL", status: "completed", time: "3ч назад" },
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
  { text: "Escrow → продавец: сделка #89 (Judge OK)", time: "14 мин" },
  { text: "AI Judge: хэш датасета совпал, метрики в норме", time: "28 мин" },
  { text: "Новый лот: Reddit QA Dataset", time: "1ч" },
  { text: "Refund: не прошла валидация JSONL", time: "2ч" },
  { text: "Dispute закрыт: арбитр в пользу покупателя", time: "5ч" },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
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
        <div className="lg:col-span-2 surface">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground">Последние сделки</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" asChild>
              <Link to="/escrow">Все в Escrow →</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentDeals.map((task, i) => (
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
