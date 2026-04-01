import { useState } from "react";
import { Clock, ShieldCheck, Mic, Image, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-api";
import type { Task } from "@/lib/api";

const typeIcon: Record<string, React.ElementType> = { captcha: ShieldCheck, "tts_stt": Mic, annotation: Image };
const filters = ["Все", "captcha", "tts_stt", "annotation"];
const filterLabels: Record<string, string> = { "Все": "Все", captcha: "CAPTCHA", tts_stt: "TTS/STT", annotation: "Аннотация" };

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState("Все");
  const { data: tasks, isLoading, error } = useTasks("open");

  const filtered = activeFilter === "Все"
    ? (tasks ?? [])
    : (tasks ?? []).filter((t) => t.task_type === activeFilter);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Маркетплейс задач</h1>
          <p className="text-sm text-muted-foreground mt-1">{tasks?.length ?? 0} активных заданий</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
          + Создать задачу
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={activeFilter === f ? "default" : "ghost"}
            className={activeFilter === f
              ? "bg-primary text-primary-foreground text-xs"
              : "text-muted-foreground text-xs hover:text-foreground"}
            onClick={() => setActiveFilter(f)}
          >
            {filterLabels[f] || f}
          </Button>
        ))}
      </div>

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_90px_80px_100px_100px] gap-4 px-4 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
          <span>Задача</span>
          <span>Тип</span>
          <span>Бюджет</span>
          <span>Дедлайн</span>
          <span>Слоты</span>
          <span></span>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">Ошибка загрузки: {(error as Error).message}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Нет задач</div>
        ) : (
          filtered.map((task) => {
            const Icon = typeIcon[task.task_type] || ShieldCheck;
            const full = task.slots_filled >= task.slots_total;
            return (
              <div
                key={task.id}
                className="grid grid-cols-[1fr_100px_90px_80px_100px_100px] gap-4 px-4 py-3.5 items-center border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground w-fit">
                  {task.task_type}
                </Badge>
                <span className="text-sm font-medium text-primary">{task.total_budget} SOL</span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />{task.deadline ? new Date(task.deadline).toLocaleDateString("ru-RU") : "—"}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${task.slots_total > 0 ? (task.slots_filled / task.slots_total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{task.slots_filled}/{task.slots_total}</span>
                </div>
                <Button
                  size="sm"
                  disabled={full}
                  className={full
                    ? "bg-muted text-muted-foreground text-xs"
                    : "bg-primary text-primary-foreground text-xs hover:bg-primary/90"}
                >
                  {full ? "Занято" : "Взять"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
