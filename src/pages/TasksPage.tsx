import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, ListTodo, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { apiBase } from "@/lib/api/env";
import { createPlatformTask, listPlatformTasks, patchPlatformTaskStatus, type PlatformTaskDto } from "@/lib/api/tasks";
import { TASK_CATEGORY_LABELS } from "@/lib/tasks/categories";
import { toast } from "sonner";

const CATEGORY_FILTER = ["Все", ...Object.keys(TASK_CATEGORY_LABELS).map(String)] as const;

function categoryLabel(cat: number): string {
  return TASK_CATEGORY_LABELS[cat] ?? `#${cat}`;
}

function statusBadgeClass(status: string): string {
  if (status === "done") return "border-green-500/30 text-green-400 bg-green-500/5";
  if (status === "in_progress") return "border-primary/30 text-primary bg-primary/5";
  return "border-border text-muted-foreground";
}

export default function TasksPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("Все");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("0");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { connected, address, connect } = useSolanaWallet();
  const apiBaseStr = apiBase();

  const tasksQuery = useQuery({
    queryKey: ["platform-tasks", apiBaseStr],
    queryFn: () => listPlatformTasks(200),
    staleTime: 15_000,
  });

  const rows: PlatformTaskDto[] = tasksQuery.data ?? [];
  const filtered: PlatformTaskDto[] =
    categoryFilter === "Все"
      ? rows
      : rows.filter((t) => t.category === Number(categoryFilter));

  async function submitTask() {
    if (!title.trim()) {
      toast.error("Нужен заголовок");
      return;
    }
    if (!description.trim()) {
      toast.error("Нужно описание");
      return;
    }
    setSubmitting(true);
    try {
      const cat = Number(category);
      await createPlatformTask({
        title: title.trim(),
        description: description.trim(),
        category: Number.isInteger(cat) && cat >= 0 && cat <= 6 ? cat : 0,
        createdBy: connected && address ? address : null,
        status: "open",
      });
      toast.success("Задача создана", { description: "Сохранено в БД оркестратора." });
      setTitle("");
      setDescription("");
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["platform-tasks", apiBaseStr] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSubmitting(false);
    }
  }

  async function setTaskStatus(id: string, status: "open" | "in_progress" | "done") {
    try {
      await patchPlatformTaskStatus(id, status);
      await queryClient.invalidateQueries({ queryKey: ["platform-tasks", apiBaseStr] });
      toast.success("Статус обновлён");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Задачи</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Офчейн-задачи маркетплейса в SQLite/Postgres оркестратора:{" "}
            <code className="text-[10px] bg-muted px-1 rounded">GET/POST /api/tasks</code>,{" "}
            <code className="text-[10px] bg-muted px-1 rounded">PATCH /api/tasks/:id</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={tasksQuery.isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: ["platform-tasks", apiBaseStr] })}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${tasksQuery.isFetching ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            onClick={() => setCreateOpen(true)}
          >
            + Создать задачу
          </Button>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Оркестратор</AlertTitle>
        <AlertDescription>
          <span className="font-mono text-xs break-all">{apiBaseStr}</span>
          <p className="text-xs text-muted-foreground mt-2">
            Миграция таблицы: <code className="text-[10px]">server/migrations/002_platform_tasks.sql</code>. В dev из корня:{" "}
            <code className="text-[10px]">npm run dev</code> (Vite + API на 8787) или только{" "}
            <code className="text-[10px]">npm run server:dev</code>.
          </p>
        </AlertDescription>
      </Alert>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новая задача</DialogTitle>
            <DialogDescription>Данные пишутся в БД Node-оркестратора (.env с DATABASE_URL).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {!connected && (
              <p className="text-sm text-muted-foreground">
                Кошелёк опционален. Можно подключить Phantom — тогда{" "}
                <code className="text-[10px]">createdBy</code> заполнится автоматически.
                <Button type="button" variant="link" className="h-auto p-0 ml-1 text-xs" onClick={() => void connect()}>
                  Подключить
                </Button>
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="task-title">Заголовок</Label>
              <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Кратко" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Описание</Label>
              <Textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Детали задачи"
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_CATEGORY_LABELS).map(([n, label]) => (
                    <SelectItem key={n} value={n}>
                      {n}: {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Закрыть
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitTask()}>
              {submitting ? "Сохранение…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_FILTER.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={categoryFilter === f ? "default" : "ghost"}
            className={
              categoryFilter === f
                ? "bg-primary text-primary-foreground text-xs"
                : "text-muted-foreground text-xs hover:text-foreground"
            }
            onClick={() => setCategoryFilter(f)}
          >
            {f === "Все" ? "Все" : `${f}: ${TASK_CATEGORY_LABELS[Number(f)] ?? f}`}
          </Button>
        ))}
      </div>

      {tasksQuery.isError && (
        <p className="text-sm text-destructive">
          {tasksQuery.error instanceof Error ? tasksQuery.error.message : "Не удалось загрузить задачи"}
        </p>
      )}

      <div className="surface overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[minmax(0,1fr)_100px_90px_120px_100px] gap-2 px-3 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>Задача</span>
          <span>Категория</span>
          <span>Статус</span>
          <span>Создана</span>
          <span className="text-right">Действие</span>
        </div>

        {tasksQuery.isLoading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Загрузка…</div>
        )}

        {!tasksQuery.isLoading && filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Задач нет. Создайте запись кнопкой выше или примените SQL-миграцию на оркестраторе.
          </div>
        )}

        {filtered.map((task) => (
          <div
            key={task.id}
            className="grid grid-cols-[minmax(0,1fr)_100px_90px_120px_100px] gap-2 px-3 py-3 items-center border-b border-border/50 hover:bg-muted/20 text-sm"
          >
            <div className="flex gap-2 min-w-0">
              <ListTodo className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-0.5">
                <div className="font-medium text-foreground truncate">{task.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                {task.createdBy && (
                  <p className="text-[10px] font-mono text-muted-foreground truncate" title={task.createdBy}>
                    {task.createdBy.slice(0, 4)}…{task.createdBy.slice(-4)}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground w-fit h-fit justify-self-start">
              {categoryLabel(task.category)}
            </Badge>
            <Badge variant="outline" className={`text-[10px] w-fit h-fit justify-self-start ${statusBadgeClass(task.status)}`}>
              {task.status}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3 flex-shrink-0" />
              {task.createdAt
                ? new Date(task.createdAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })
                : "—"}
            </span>
            <div className="flex justify-end">
              <Select
                value={task.status}
                onValueChange={(v) => void setTaskStatus(task.id, v as "open" | "in_progress" | "done")}
              >
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">open</SelectItem>
                  <SelectItem value="in_progress">in_progress</SelectItem>
                  <SelectItem value="done">done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Показано: {filtered.length} из {rows.length} · фильтр: {categoryFilter}
      </p>
    </div>
  );
}
