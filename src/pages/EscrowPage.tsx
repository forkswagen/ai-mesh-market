import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, CheckCircle, Bot, Scale, AlertTriangle, ArrowRight, Loader2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DATA_ARBITER_PROGRAM_ID, AI_JUDGE_MAX_REASON_BYTES } from "@/lib/solana/escrow";
import { orchestratorConnectionHint } from "@/lib/api/connectionHints";
import { fetchDealsList, postDemoSeeded } from "@/lib/api/deals";
import { fetchApiHealth } from "@/lib/api/health";
import { useOrchestratorDealsWs } from "@/hooks/useOrchestratorDealsWs";
import { toast } from "sonner";

const steps = [
  { icon: Lock, title: "Инициализация", desc: "initialize_escrow · PDA escrow[buyer,seller,deal_id]" },
  { icon: CheckCircle, title: "Депозит", desc: "deposit — покупатель блокирует SOL в PDA" },
  { icon: Bot, title: "Датасет", desc: "submit_dataset_hash — хэш deliverable" },
  { icon: Scale, title: "AI Oracle", desc: "сервер: LLM или эвристика → ai_judge (атомарный payout)" },
];

const onChainIx = [
  "initialize_escrow(deal_id, amount, expected_hash, judge_authority?)",
  "deposit()",
  "submit_dataset_hash([u8;32])",
  `ai_judge(deal_id, verdict, reason) · reason ≤ ${AI_JUDGE_MAX_REASON_BYTES} bytes`,
  "release_to_seller / refund_buyer — только если задан judge_authority",
];

function stateBadge(state: string) {
  const map: Record<string, string> = {
    settled: "bg-green-500/10 text-green-400 border-green-500/20",
    chain_in_progress: "bg-primary/10 text-primary border-primary/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    created: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  return map[state] || "bg-muted text-muted-foreground border-border";
}

export default function EscrowPage() {
  const qc = useQueryClient();
  useOrchestratorDealsWs(qc);
  const healthQ = useQuery({
    queryKey: ["api", "health"],
    queryFn: fetchApiHealth,
    retry: 1,
    staleTime: 15_000,
  });
  const dealsQ = useQuery({
    queryKey: ["orchestrator", "deals"],
    queryFn: fetchDealsList,
    retry: 1,
  });

  const demoM = useMutation({
    mutationFn: () => postDemoSeeded({}),
    onSuccess: (data) => {
      if (data.state === "settled") {
        toast.success("Сделка закрыта on-chain (ai_judge)");
      } else if (data.state === "created" && data.reason) {
        toast.success("Создана запись escrow в depai-backend");
        toast.message(data.reason);
      } else {
        toast.success("Запрос выполнен");
      }
      qc.invalidateQueries({ queryKey: ["orchestrator", "deals"] });
      if (data.signatures?.sigJudge) {
        toast.info(`ai_judge: ${data.signatures.sigJudge.slice(0, 16)}…`, {
          description: `https://solscan.io/tx/${data.signatures.sigJudge}?cluster=devnet`,
        });
      }
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка demo"),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">AI-oracled Escrow · NexusAI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Agent economy: серверный оркул (LLM или эвристика) подписывает{" "}
          <code className="text-xs bg-muted px-1 rounded">ai_judge</code> на devnet. Локально: оркестратор{" "}
          <code className="text-xs bg-muted px-1 rounded">server/ :8787</code> (или <code className="text-xs bg-muted px-1 rounded">depai-backend</code>). Контракт{" "}
          <span className="text-foreground/90">data_arbiter</span>
        </p>
      </div>

      <div
        className={`surface p-3 flex flex-wrap items-center gap-2 text-sm border ${
          healthQ.isError
            ? "border-destructive/40 bg-destructive/5"
            : healthQ.isSuccess
              ? "border-green-500/25 bg-green-500/5"
              : "border-border"
        }`}
      >
        {healthQ.isLoading && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Проверка оркестратора…</span>
          </>
        )}
        {healthQ.isError && (
          <>
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-destructive text-sm leading-snug">
              Нет <code className="bg-muted px-1 rounded">/health</code>. {orchestratorConnectionHint()}{" "}
              <span className="text-xs opacity-90">{(healthQ.error as Error)?.message}</span>
            </span>
          </>
        )}
        {healthQ.isSuccess && healthQ.data && (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-foreground">
              Оркестратор доступен: {healthQ.data.app} · <span className="text-muted-foreground">{healthQ.data.env}</span>
            </span>
          </>
        )}
      </div>

      <div className="surface p-5 space-y-3 border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading font-semibold text-foreground text-sm">Demo: полный цикл on-chain</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Запуск из корня: <code className="bg-muted px-1 rounded">npm run dev:demo</code> (или отдельно{" "}
            <code className="bg-muted px-1 rounded">server/</code> + <code className="bg-muted px-1 rounded">npm run dev</code>).
            Vite проксирует <code className="bg-muted px-1 rounded">/api</code> → <code className="bg-muted px-1 rounded">127.0.0.1:8787</code>.
            Список сделок с локального оркестратора работает без JWT; <code className="bg-muted px-1 rounded">VITE_DEPAI_DEV_WALLET</code> в{" "}
            <code className="bg-muted px-1 rounded">.env.local</code> — опционально для auth на depai-backend.
          </p>
        </div>
        <Button
          className="shrink-0 gap-2"
          disabled={demoM.isPending}
          onClick={() => demoM.mutate()}
        >
          {demoM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Запустить seeded demo
        </Button>
      </div>

      <div className="surface p-5 space-y-3 border-primary/20">
        <h2 className="font-heading font-semibold text-foreground text-sm">Program ID (devnet)</h2>
        <p className="text-xs font-mono break-all text-primary">{DATA_ARBITER_PROGRAM_ID.toBase58()}</p>
        <p className="text-xs text-muted-foreground">
          API контракт: <code className="bg-muted px-1 rounded">docs/API_CONTRACT.md</code> · переносимый в depai-backend
        </p>
      </div>

      <div className="surface p-5">
        <h2 className="font-heading font-semibold text-foreground mb-4">Поток</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2.5 bg-muted rounded-lg px-4 py-3 min-w-[200px]">
                <s.icon className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{s.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="surface p-5">
        <h2 className="font-heading font-semibold text-foreground mb-3">Инструкции Anchor</h2>
        <ul className="text-xs text-muted-foreground space-y-2 font-mono">
          {onChainIx.map((line) => (
            <li key={line} className="border-b border-border/50 pb-2 last:border-0">
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="surface overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-semibold text-foreground">Сделки оркестратора</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            GET /api/deals
          </div>
        </div>
        {dealsQ.isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : dealsQ.isError ? (
          <div className="p-6 text-sm text-muted-foreground space-y-2">
            <p>
              Нет связи с <code className="bg-muted px-1 rounded">GET /api/deals</code>. {orchestratorConnectionHint()}
            </p>
            <p className="text-destructive text-xs">{(dealsQ.error as Error).message}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(dealsQ.data?.deals?.length ?? 0) === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Пока нет записей — нажми «Запустить seeded demo».</div>
            ) : (
              dealsQ.data?.deals.map((d) => (
                <div key={d.id} className="p-4 grid gap-2 sm:grid-cols-[1fr_auto] text-sm">
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-xs text-muted-foreground truncate">{d.id}</p>
                    <p className="text-foreground">
                      deal_id <span className="font-mono">{d.deal_id}</span> · {d.amount_lamports} lamports
                    </p>
                    <p className="text-xs text-muted-foreground truncate">buyer {d.buyer.slice(0, 8)}… · seller {d.seller.slice(0, 8)}…</p>
                    {d.reason && (
                      <p className="text-xs text-muted-foreground">
                        Oracle: {d.verdict ? "release" : "refund"} — {d.reason}
                      </p>
                    )}
                    {d.error && <p className="text-xs text-destructive">{d.error}</p>}
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <Badge variant="outline" className={`text-[10px] ${stateBadge(d.state)}`}>
                      {d.state}
                    </Badge>
                    {d.judge_sig && (
                      <a
                        href={`https://solscan.io/tx/${d.judge_sig}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        ai_judge tx →
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
