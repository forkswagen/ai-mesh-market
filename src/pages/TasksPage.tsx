import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, ExternalLink, ListTodo, RefreshCw } from "lucide-react";
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
import { getBackendOrigin, getBackendWsBaseUrl } from "@/lib/api/backendOrigin";
import {
  createVerbittoOffchainTask,
  listVerbittoOffchainTasks,
  type VerbittoOffchainTaskDto,
} from "@/lib/api/verbitto";
import { VERBITTO_TASK_CATEGORY_LABELS, getVerbittoProgramId } from "@/lib/verbitto/constants";
import { verbittoPlatformPda } from "@/lib/verbitto/pda";
import { sha256Utf8Hex } from "@/lib/verbitto/hash";
import { solscanAccountUrl } from "@/lib/solana/rpc";
import { toast } from "sonner";

const CATEGORY_FILTER = ["Все", ...Object.keys(VERBITTO_TASK_CATEGORY_LABELS).map(String)] as const;

function categoryLabel(cat: number | null): string {
  if (cat == null) return "—";
  return VERBITTO_TASK_CATEGORY_LABELS[cat] ?? `#${cat}`;
}

function shortenPk(s: string, left = 6, right = 4): string {
  if (s.length <= left + right + 1) return s;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
}

export default function TasksPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("Все");
  const [createOpen, setCreateOpen] = useState(false);
  const [vbTitle, setVbTitle] = useState("");
  const [vbDescription, setVbDescription] = useState("");
  const [vbCategory, setVbCategory] = useState<string>("0");
  const [vbSubmitting, setVbSubmitting] = useState(false);
  const [vbLast, setVbLast] = useState<{ id: string; descriptionHashHex: string } | null>(null);
  const queryClient = useQueryClient();
  const { connected, address, connect } = useSolanaWallet();
  const verbittoProgram = getVerbittoProgramId();
  const platformPda = verbittoProgram ? verbittoPlatformPda(verbittoProgram)[0].toBase58() : null;
  const apiBase = getBackendOrigin();

  const tasksQuery = useQuery({
    queryKey: ["verbitto-offchain-tasks", apiBase],
    queryFn: () => listVerbittoOffchainTasks(200),
    staleTime: 15_000,
  });

  useEffect(() => {
    const wsBase = getBackendWsBaseUrl().replace(/\/$/, "");
    const url = `${wsBase}/api/v1/ws/verbitto-tasks`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(url);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as { type?: string };
          if (msg.type === "verbitto_tasks_updated") {
            void queryClient.invalidateQueries({ queryKey: ["verbitto-offchain-tasks", apiBase] });
          }
        } catch {
          /* ignore */
        }
      };
      ws.onerror = () => {
        /* Vercel serverless может не держать WS — список всё равно доступен по REST */
      };
    } catch {
      /* ignore */
    }
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, [apiBase, queryClient]);

  const rows: VerbittoOffchainTaskDto[] = tasksQuery.data ?? [];
  const filtered: VerbittoOffchainTaskDto[] =
    categoryFilter === "Все"
      ? rows
      : rows.filter((t) => t.taskCategory === Number(categoryFilter));

  async function submitVerbittoOffchain() {
    if (!connected || !address) {
      toast.error("Подключите кошелёк", { description: "Нужен creator для записи в БД бэкенда." });
      void connect();
      return;
    }
    if (!vbDescription.trim()) {
      toast.error("Добавьте описание задачи");
      return;
    }
    setVbSubmitting(true);
    setVbLast(null);
    try {
      const cat = Number(vbCategory);
      const res = await createVerbittoOffchainTask({
        creatorPublicKey: address,
        title: vbTitle.trim() || undefined,
        description: vbDescription.trim(),
        taskCategory: Number.isInteger(cat) ? cat : undefined,
      });
      const localHash = await sha256Utf8Hex(vbDescription.trim());
      if (localHash !== res.descriptionHashHex) {
        console.warn("[Verbitto] client/server hash mismatch", localHash, res.descriptionHashHex);
      }
      setVbLast({ id: res.id, descriptionHashHex: res.descriptionHashHex });
      toast.success("Задача сохранена", {
        description: "Данные в Postgres бэкенда; подписчики WS получат обновление.",
      });
      setVbTitle("");
      setVbDescription("");
      await queryClient.invalidateQueries({ queryKey: ["verbitto-offchain-tasks", apiBase] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setVbSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Задачи Verbitto</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Таблица <code className="text-[10px]">verbitto_offchain_tasks</code> в БД{" "}
            <strong>SolToloka backend</strong> (FastAPI). Хэш описания для инструкции{" "}
            <code className="text-[10px]">create_task</code> на чейне. Обновления рассылаются по WebSocket{" "}
            <code className="text-[10px]">/api/v1/ws/verbitto-tasks</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={tasksQuery.isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: ["verbitto-offchain-tasks", apiBase] })}
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
        <AlertTitle className="text-sm">Backend API</AlertTitle>
        <AlertDescription>
          <span className="font-mono text-xs break-all">{apiBase}</span>
          <p className="text-xs text-muted-foreground mt-2">
            Убедитесь, что в Postgres применена миграция{" "}
            <code className="text-[10px]">migrations/verbitto_offchain_tasks.sql</code> (или включён DEBUG с
            create_all).
          </p>
        </AlertDescription>
      </Alert>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новая задача (→ БД бэкенда)</DialogTitle>
            <DialogDescription>
              Описание и SHA-256 сохраняются на сервере. Транзакцию{" "}
              <code className="text-xs">create_task</code> подписывает кошелёк отдельно (Anchor / IDL).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {!connected && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Подключите Phantom — в БД пишется ваш публичный ключ как создатель.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="vb-title">Заголовок (опционально)</Label>
              <Input
                id="vb-title"
                value={vbTitle}
                onChange={(e) => setVbTitle(e.target.value)}
                placeholder="Краткое название"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vb-desc">Описание (входит в хэш)</Label>
              <Textarea
                id="vb-desc"
                value={vbDescription}
                onChange={(e) => setVbDescription(e.target.value)}
                placeholder="Текст для SHA-256, как в документации Verbitto…"
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={vbCategory} onValueChange={setVbCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VERBITTO_TASK_CATEGORY_LABELS).map(([n, label]) => (
                    <SelectItem key={n} value={n}>
                      {n}: {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {platformPda && (
              <p className="text-xs text-muted-foreground break-all">
                Platform PDA (сверьте с IDL): {platformPda}
              </p>
            )}
            {!verbittoProgram && (
              <p className="text-xs text-muted-foreground">
                Опционально: <code className="text-[10px]">VITE_VERBITTO_PROGRAM_ID</code> для отображения PDA.
              </p>
            )}
            {vbLast && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1">
                <div>
                  <span className="text-muted-foreground">id:</span>{" "}
                  <span className="font-mono break-all">{vbLast.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">description_hash:</span>{" "}
                  <span className="font-mono break-all">{vbLast.descriptionHashHex}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Закрыть
            </Button>
            <Button type="button" disabled={vbSubmitting} onClick={() => void submitVerbittoOffchain()}>
              {vbSubmitting ? "Сохранение…" : "Сохранить в БД"}
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
            {f === "Все" ? "Все" : `${f}: ${VERBITTO_TASK_CATEGORY_LABELS[Number(f)] ?? f}`}
          </Button>
        ))}
      </div>

      {tasksQuery.isError && (
        <p className="text-sm text-destructive">
          {tasksQuery.error instanceof Error ? tasksQuery.error.message : "Не удалось загрузить задачи"}
        </p>
      )}

      <div className="surface overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[minmax(0,1.2fr)_100px_100px_90px_100px_48px] gap-2 px-3 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>Задача</span>
          <span>Категория</span>
          <span>Создатель</span>
          <span>Хэш</span>
          <span>Создана</span>
          <span></span>
        </div>

        {tasksQuery.isLoading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Загрузка…</div>
        )}

        {!tasksQuery.isLoading && filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Нет задач. Создайте запись кнопкой выше или примените SQL-миграцию на бэкенде.
          </div>
        )}

        {filtered.map((task) => (
          <div
            key={task.id}
            className="grid grid-cols-[minmax(0,1.2fr)_100px_100px_90px_100px_48px] gap-2 px-3 py-3 items-start border-b border-border/50 hover:bg-muted/20 text-sm"
          >
            <div className="flex gap-2 min-w-0">
              <ListTodo className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-0.5">
                <div className="font-medium text-foreground truncate">{task.title || "Без названия"}</div>
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground w-fit h-fit">
              {categoryLabel(task.taskCategory)}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono truncate" title={task.creatorPublicKey}>
              {shortenPk(task.creatorPublicKey)}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground truncate" title={task.descriptionHashHex}>
              {task.descriptionHashHex.slice(0, 10)}…
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3 flex-shrink-0" />
              {task.createdAt
                ? new Date(task.createdAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })
                : "—"}
            </span>
            <div className="flex justify-end">
              {task.chainTaskPublicKey ? (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={solscanAccountUrl(task.chainTaskPublicKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Solscan"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground pt-1">—</span>
              )}
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
