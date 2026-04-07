import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Lock,
  CheckCircle,
  Bot,
  Scale,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DATA_ARBITER_PROGRAM_ID, AI_JUDGE_MAX_REASON_BYTES } from "@/lib/solana/escrow";
import { missingViteApiBaseUrlMessage } from "@/lib/api/connectionHints";
import { isOrchestratorOriginConfigured, wrongOrchestratorUrlMessage } from "@/lib/api/backendOrigin";
import { fetchDealsList, postDemoSeeded } from "@/lib/api/deals";
import { fetchApiHealth } from "@/lib/api/health";
import { fetchOracleWorkersStats } from "@/lib/api/oracleWorkers";
import { useOrchestratorDealsWs } from "@/hooks/useOrchestratorDealsWs";
import { useAgentChannelWs } from "@/hooks/useAgentChannelWs";
import { toast } from "sonner";

const steps = [
  { icon: Lock, title: "Инициализация", desc: "initialize_escrow · PDA escrow[buyer,seller,deal_id]" },
  { icon: CheckCircle, title: "Депозит", desc: "deposit — покупатель блокирует SOL в PDA" },
  { icon: Bot, title: "Датасет", desc: "submit_dataset_hash — хэш deliverable" },
  {
    icon: Scale,
    title: "AI Oracle",
    desc: "приоритет: воркеры /ws/oracle-worker (round-robin по локальным LM), иначе LM сервера → ai_judge",
  },
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
  const wrongRpcUrl = wrongOrchestratorUrlMessage();
  const orchestratorReady = isOrchestratorOriginConfigured();
  const configBannerText = wrongRpcUrl || (!orchestratorReady ? missingViteApiBaseUrlMessage() : "");

  useOrchestratorDealsWs(qc, orchestratorReady);
  const agentWs = useAgentChannelWs(orchestratorReady);
  const [oracleModel, setOracleModel] = useState("");
  const [oracleWorkerSessionId, setOracleWorkerSessionId] = useState("");
  const healthQ = useQuery({
    queryKey: ["api", "health"],
    queryFn: fetchApiHealth,
    enabled: orchestratorReady,
    retry: 1,
    staleTime: 15_000,
  });
  const dealsQ = useQuery({
    queryKey: ["orchestrator", "deals"],
    queryFn: fetchDealsList,
    enabled: orchestratorReady,
    retry: 1,
  });
  const oracleHostsQ = useQuery({
    queryKey: ["orchestrator", "oracle-workers"],
    queryFn: fetchOracleWorkersStats,
    enabled: orchestratorReady,
    refetchInterval: 4_000,
    staleTime: 2_000,
    retry: 1,
  });

  const demoM = useMutation({
    mutationFn: () => {
      const agents = oracleHostsQ.data?.agents ?? [];
      const host = agents.find((a) => a.sessionId === oracleWorkerSessionId);
      return postDemoSeeded({
        ...(oracleModel.trim() ? { oracleLlmModel: oracleModel.trim() } : {}),
        ...(host?.logicalId ? { oracleWorkerAgentId: host.logicalId } : {}),
      });
    },
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
        <h1 className="font-heading text-2xl font-bold text-foreground">AI-oracled Escrow · Escora</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Agent economy: оркул подписывает <code className="text-xs bg-muted px-1 rounded">ai_judge</code> на devnet. REST и
          WebSocket по умолчанию — <strong className="text-foreground/90">Node-оркестратор</strong>{" "}
          <code className="text-xs bg-muted px-1 rounded">server/</code> (в dev <code className="text-xs bg-muted px-1 rounded">:8787</code>
          , в проде задайте <code className="text-xs bg-muted px-1 rounded">VITE_API_BASE_URL</code>). Программа{" "}
          <span className="text-foreground/90">data_arbiter</span>
        </p>
      </div>

      {configBannerText && (
        <div
          className={`surface p-4 flex gap-3 text-sm border ${
            wrongRpcUrl
              ? "border-amber-500/40 bg-amber-500/5 text-foreground"
              : "border-amber-500/35 bg-amber-500/5 text-foreground"
          }`}
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">{configBannerText}</p>
        </div>
      )}

      <div
        className={`surface p-3 flex flex-wrap items-center gap-2 text-sm border ${
          !orchestratorReady
            ? "border-border bg-muted/20"
            : healthQ.isError
              ? "border-destructive/40 bg-destructive/5"
              : healthQ.isSuccess
                ? "border-green-500/25 bg-green-500/5"
                : "border-border"
        }`}
      >
        {!orchestratorReady && (
          <>
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-sm">
              <code className="bg-muted px-1 rounded">/health</code> не запрашивается, пока не задан корректный URL Node-оркестратора — см. блок выше (
              <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code> = деплой <code className="bg-muted px-1 rounded">server/</code>
              , не Solana RPC).
            </span>
          </>
        )}
        {orchestratorReady && healthQ.isLoading && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Проверка /health…</span>
          </>
        )}
        {orchestratorReady && healthQ.isError && (
          <>
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-destructive text-sm leading-snug">
              Нет ответа <code className="bg-muted px-1 rounded">/health</code>. {(healthQ.error as Error)?.message}
            </span>
          </>
        )}
        {orchestratorReady && healthQ.isSuccess && healthQ.data && (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-foreground">
              API доступен: {healthQ.data.app ?? healthQ.data.status ?? "ok"}
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

      <div className="surface p-5 space-y-3 border-border">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="font-heading font-semibold text-foreground text-sm">Agent ↔ backend ↔ frontend</h2>
            <p className="text-xs text-muted-foreground leading-snug">
              Список моделей приходит с LM Studio через оркестратор (<code className="bg-muted px-1 rounded">/ws/agent</code>,{" "}
              <code className="bg-muted px-1 rounded">GET /api/agent/models</code>). В браузере нет прямого доступа к LM Studio.
              В <code className="bg-muted px-1 rounded">server/.env</code> задай{" "}
              <code className="bg-muted px-1 rounded">LM_STUDIO_BASE_URL</code> и при необходимости{" "}
              <code className="bg-muted px-1 rounded">ORACLE_LLM_URL</code>.
            </p>
            {agentWs.snapshot?.baseUrl && (
              <p className="text-xs font-mono break-all text-muted-foreground">LM: {agentWs.snapshot.baseUrl}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className={agentWs.connected ? "border-green-500/40 text-green-400" : ""}>
              WS agent {agentWs.connected ? "online" : "…"}
            </Badge>
            {oracleHostsQ.isSuccess && oracleHostsQ.data && (
              <Badge
                variant="outline"
                title={
                  oracleHostsQ.data.workerIds.length
                    ? oracleHostsQ.data.workerIds.join("\n")
                    : "Запуск на хосте: npm run oracle-worker --prefix server"
                }
                className={
                  oracleHostsQ.data.connected > 0
                    ? "border-cyan-500/40 text-cyan-400 gap-1"
                    : "border-border text-muted-foreground gap-1"
                }
              >
                <Server className="h-3 w-3" />
                Хостов LM: {oracleHostsQ.data.connected}
                {oracleHostsQ.data.busy > 0 ? ` · ${oracleHostsQ.data.busy} занято` : ""}
              </Badge>
            )}
            {oracleHostsQ.isError && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px]">
                Хосты: нет данных
              </Badge>
            )}
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => agentWs.refresh()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Обновить модели
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-snug flex items-start gap-2">
          <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <span>
            Подключённые <strong className="text-foreground/90">хостовые машины</strong> с LM Studio (процесс{" "}
            <code className="bg-muted px-1 rounded">oracle-worker</code>, аналог связки soltoloka-agent → оркестратор): канал{" "}
            <code className="bg-muted px-1 rounded">/ws/oracle-worker</code>, счётчик обновляется каждые ~4 с (
            <code className="bg-muted px-1 rounded">GET /api/agent/oracle-workers</code>).
          </span>
        </p>
        {agentWs.snapshot?.error && (
          <p className="text-xs text-destructive leading-snug">{agentWs.snapshot.error}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label className="text-xs text-muted-foreground shrink-0" htmlFor="oracle-model">
            Модель для oracle (seeded demo)
          </label>
          <select
            id="oracle-model"
            className="flex h-9 w-full sm:max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={oracleModel}
            onChange={(e) => setOracleModel(e.target.value)}
            disabled={demoM.isPending}
          >
            <option value="">По умолчанию (ORACLE_LLM_MODEL в .env)</option>
            {(agentWs.snapshot?.models || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label className="text-xs text-muted-foreground shrink-0" htmlFor="oracle-host">
            Хост oracle-worker (опционально)
          </label>
          <select
            id="oracle-host"
            className="flex h-9 w-full sm:max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={oracleWorkerSessionId}
            onChange={(e) => setOracleWorkerSessionId(e.target.value)}
            disabled={demoM.isPending}
          >
            <option value="">Round-robin по accepting</option>
            {(oracleHostsQ.data?.agents ?? [])
              .filter((a) => a.accepting)
              .map((a) => (
                <option key={a.sessionId} value={a.sessionId}>
                  {a.name} · {a.logicalId}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="surface p-5 space-y-3 border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading font-semibold text-foreground text-sm">Demo: полный цикл on-chain</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Нужны <code className="bg-muted px-1 rounded">POST /api/demo/seeded</code> и ключи в{" "}
            <code className="bg-muted px-1 rounded">server/.env</code>. Запуск из корня:{" "}
            <code className="bg-muted px-1 rounded">npm run dev</code> (Vite + оркестратор).
          </p>
        </div>
        <Button
          className="shrink-0 gap-2"
          disabled={demoM.isPending || !orchestratorReady}
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
          <h2 className="font-heading font-semibold text-foreground">Сделки (GET /api/deals)</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            GET /api/deals
          </div>
        </div>
        {!orchestratorReady ? (
          <div className="p-6 text-sm text-muted-foreground">
            Список сделок запрашивается у оркестратора. Настройте URL (см. жёлтый блок выше), затем Redeploy.
          </div>
        ) : dealsQ.isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : dealsQ.isError ? (
          <div className="p-6 text-sm text-muted-foreground space-y-2">
            <p>
              Нет связи с <code className="bg-muted px-1 rounded">GET /api/deals</code>.
            </p>
            <p className="text-destructive text-xs whitespace-pre-wrap leading-relaxed">
              {(dealsQ.error as Error).message}
            </p>
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
