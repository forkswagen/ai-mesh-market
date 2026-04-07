import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  ExternalLink,
  ListTodo,
  RefreshCw,
} from "lucide-react";
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
import { getVerbittoApiOrigin } from "@/lib/api/backendOrigin";
import { createVerbittoOffchainTask, listVerbittoOffchainTasks, type VerbittoOffchainTaskDto } from "@/lib/api/verbitto";
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
  const [verbittoOpen, setVerbittoOpen] = useState(false);
  const [vbTitle, setVbTitle] = useState("");
  const [vbDescription, setVbDescription] = useState("");
  const [vbCategory, setVbCategory] = useState<string>("0");
  const [vbSubmitting, setVbSubmitting] = useState(false);
  const [vbLast, setVbLast] = useState<{ id: string; descriptionHashHex: string } | null>(null);

  const queryClient = useQueryClient();
  const { connected, address, connect } = useSolanaWallet();
  const verbittoProgram = getVerbittoProgramId();
  const platformPda = verbittoProgram ? verbittoPlatformPda(verbittoProgram)[0].toBase58() : null;
  const verbittoApiBase = getVerbittoApiOrigin();

  const tasksQuery = useQuery({
    queryKey: ["verbitto-offchain-tasks", verbittoApiBase],
    queryFn: () => listVerbittoOffchainTasks(200),
    enabled: Boolean(verbittoApiBase),
    staleTime: 15_000,
  });

  const rows: VerbittoOffchainTaskDto[] = tasksQuery.data ?? [];
  const filtered: VerbittoOffchainTaskDto[] =
    categoryFilter === "Все"
      ? rows
      : rows.filter((t) => t.taskCategory === Number(categoryFilter));

  async function submitVerbittoOffchain() {
    if (!verbittoApiBase) {
      toast.error("Не задан VITE_VERBITTO_API_URL", {
        description: "Укажи URL Node-оркестратора (server/) с DATABASE_URL.",
      });
      return;
    }
    if (!connected || !address) {
      toast.error("Подключите кошелёк", { description: "Нужен creator для офчейн-записи." });
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
      toast.success("Задача сохранена в БД", { description: `Используйте description_hash для create_task на чейне.` });
      setVbTitle("");
      setVbDescription("");
      await queryClient.invalidateQueries({ queryKey: ["verbitto-offchain-tasks", verbittoApiBase] });
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
            Каталог из PostgreSQL (
            <code className="text-[10px]">verbitto_offchain_tasks</code>
            ) через Node <code className="text-[10px]">server/</code>, не FastAPI. Создание — офчейн + хэш для{" "}
            <code className="text-[10px]">create_task</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={!verbittoApiBase || tasksQuery.isFetching}
            onClick={() =>
              void queryClient.invalidateQueries({ queryKey: ["verbitto-offchain-tasks", verbittoApiBase] })
            }
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${tasksQuery.isFetching ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            disabled={!verbittoApiBase}
            onClick={() => setVerbittoOpen(true)}
          >
            + Создать задачу
          </Button>
        </div>
      </div>

      {!verbittoApiBase && (
        <Alert variant="destructive">
          <AlertTitle>Нужен URL оркестратора для Verbitto</AlertTitle>
          <AlertDescription>
            SolToloka backend не отдаёт <code className="text-xs">/api/verbitto/*</code>. В проде задай{" "}
            <code className="text-xs">VITE_VERBITTO_API_URL</code> на деплой Node{" "}
            <code className="text-xs">server/</code> с <code className="text-xs">DATABASE_URL</code> (Neon). Локально:
            <code className="text-xs"> npm run server:dev</code> на <code className="text-xs">8787</code> — в dev
            переменная не обязательна.
          </AlertDescription>
        </Alert>
      )}

      {verbittoApiBase && (
        <Alert>
          <AlertTitle className="text-sm">Эндпоинт Verbitto</AlertTitle>
          <AlertDescription>
            <span className="font-mono text-xs break-all">{verbittoApiBase}</span>
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={verbittoOpen} onOpenChange={setVerbittoOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новая задача (офчейн → БД)</DialogTitle>
            <DialogDescription>
              Описание и SHA-256 сохраняются в базе. Транзакцию{" "}
              <code className="text-xs">create_task</code> подписывает кошелёк отдельно (Anchor / IDL).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {!connected && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Подключите Phantom — creator привязывается к публичному ключу кошелька.
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
                <code className="text-[10px]">VITE_VERBITTO_PROGRAM_ID</code> — для PDA в UI.
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
            <Button type="button" variant="outline" onClick={() => setVerbittoOpen(false)}>
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

        {verbittoApiBase && tasksQuery.isLoading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Загрузка…</div>
        )}

        {verbittoApiBase && !tasksQuery.isLoading && filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Нет задач в базе. Создайте запись кнопкой выше (оркестратор с{" "}
            <code className="text-xs">DATABASE_URL</code> на Neon).
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
              {task.createdAt ? new Date(task.createdAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "—"}
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
        Показано: {filtered.length} из {rows.length} в БД · фильтр категории: {categoryFilter}
      </p>
    </div>
  );
}
