import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { getOrchestratorApiOrigin } from "@/lib/api/backendOrigin";
import {
  createPlatformTask,
  listPlatformTasks,
  patchPlatformTaskStatus,
  type PlatformTaskDto,
} from "@/lib/api/tasks";
import { TASK_CATEGORY_LABELS } from "@/lib/tasks/categories";
import { toast } from "sonner";

const CATEGORY_FILTER = ["Все", ...Object.keys(TASK_CATEGORY_LABELS).map(String)] as const;

const STATUS_LABELS: Record<string, string> = {
  open: "Открыта",
  in_progress: "В работе",
  done: "Готово",
};

function categoryLabel(cat: number): string {
  return TASK_CATEGORY_LABELS[cat] ?? `#${cat}`;
}

function shortenPk(s: string | null, left = 6, right = 4): string {
  if (!s) return "—";
  if (s.length <= left + right + 1) return s;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
}

export default function TasksPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("Все");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState<string>("0");
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { connected, address } = useSolanaWallet();
  const orchestratorBase = getOrchestratorApiOrigin();

  const tasksQuery = useQuery({
    queryKey: ["platform-tasks", orchestratorBase],
    queryFn: () => listPlatformTasks(200),
    enabled: Boolean(orchestratorBase),
    staleTime: 15_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "open" | "in_progress" | "done" }) =>
      patchPlatformTaskStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-tasks", orchestratorBase] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows: PlatformTaskDto[] = tasksQuery.data ?? [];
  const filtered: PlatformTaskDto[] =
    categoryFilter === "Все" ? rows : rows.filter((t) => t.category === Number(categoryFilter));

  async function submitCreate() {
    if (!orchestratorBase) {
      toast.error("Нет URL оркестратора");
      return;
    }
    if (!title.trim()) {
      toast.error("Укажите заголовок");
      return;
    }
    if (!description.trim()) {
      toast.error("Укажите описание");
      return;
    }
    const cat = Number(taskCategory);
    if (!Number.isInteger(cat) || cat < 0 || cat > 6) {
      toast.error("Неверная категория");
      return;
    }
    setSubmitting(true);
    try {
      await createPlatformTask({
        title: title.trim(),
        description: description.trim(),
        category: cat,
        createdBy: connected && address ? address : null,
      });
      toast.success("Задача создана");
      setTitle("");
      setDescription("");
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["platform-tasks", orchestratorBase] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Задачи</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Каталог в таблице{" "}
            <code className="text-[10px]">platform_tasks</code> (PostgreSQL или SQLite в{" "}
            <code className="text-[10px]">server/</code>). Без Verbitto и on-chain полей.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={!orchestratorBase || tasksQuery.isFetching}
            onClick={() =>
              void queryClient.invalidateQueries({ queryKey: ["platform-tasks", orchestratorBase] })
            }
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${tasksQuery.isFetching ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            disabled={!orchestratorBase}
            onClick={() => setCreateOpen(true)}
          >
            + Создать задачу
          </Button>
        </div>
      </div>

      {!orchestratorBase && (
        <Alert variant="destructive">
          <AlertTitle>Нужен URL оркестратора</AlertTitle>
          <AlertDescription>
            Задачи ходят в Node <code className="text-xs">server/</code> (<code className="text-xs">/api/tasks</code>
            ), не в SolToloka FastAPI. В проде задай{" "}
            <code className="text-xs">VITE_ORCHESTRATOR_URL</code>. Локально:{" "}
            <code className="text-xs">npm run server:dev</code> на порту <code className="text-xs">8787</code>.
          </AlertDescription>
        </Alert>
      )}

      {orchestratorBase && (
        <Alert>
          <AlertTitle className="text-sm">API задач</AlertTitle>
          <AlertDescription>
            <span className="font-mono text-xs break-all">{orchestratorBase}</span>
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новая задача</DialogTitle>
            <DialogDescription>Данные сохраняются только в БД оркестратора.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {connected && address && (
              <p className="text-xs text-muted-foreground font-mono truncate" title={address}>
                Создатель: {shortenPk(address, 8, 8)}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="task-title">Заголовок</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Краткое название"
              />
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
              <Select value={taskCategory} onValueChange={setTaskCategory}>
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
            <Button type="button" disabled={submitting} onClick={() => void submitCreate()}>
              {submitting ? "Сохранение…" : "Создать"}
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
        <div className="grid grid-cols-[minmax(0,1.2fr)_110px_130px_100px_100px] gap-2 px-3 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>Задача</span>
          <span>Категория</span>
          <span>Статус</span>
          <span>Создатель</span>
          <span>Создана</span>
        </div>

        {orchestratorBase && tasksQuery.isLoading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Загрузка…</div>
        )}

        {orchestratorBase && !tasksQuery.isLoading && filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Нет задач. Создайте запись кнопкой выше (
            <code className="text-xs">DATABASE_URL</code> на Neon или локальный SQLite).
          </div>
        )}

        {filtered.map((task) => (
          <div
            key={task.id}
            className="grid grid-cols-[minmax(0,1.2fr)_110px_130px_100px_100px] gap-2 px-3 py-3 items-start border-b border-border/50 hover:bg-muted/20 text-sm"
          >
            <div className="flex gap-2 min-w-0">
              <ListTodo className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-0.5">
                <div className="font-medium text-foreground">{task.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground w-fit h-fit">
              {categoryLabel(task.category)}
            </Badge>
            <Select
              value={task.status}
              disabled={statusMutation.isPending}
              onValueChange={(v) => {
                const st = v as "open" | "in_progress" | "done";
                statusMutation.mutate({ id: task.id, status: st });
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as ("open" | "in_progress" | "done")[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground font-mono truncate" title={task.createdBy ?? ""}>
              {shortenPk(task.createdBy)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3 flex-shrink-0" />
              {task.createdAt
                ? new Date(task.createdAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })
                : "—"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Показано: {filtered.length} из {rows.length} в БД · фильтр: {categoryFilter}
      </p>
    </div>
  );
}
