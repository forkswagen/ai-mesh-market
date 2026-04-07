import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Link2, Loader2, RefreshCw, Send, Server, Star, Shield, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiBase } from "@/lib/api/env";
import { fetchLiveAgents } from "@/lib/api/agentLive";
import { postAgentInfer } from "@/lib/api/agentInfer";
import { fetchAgentsRegistry, postAgentsChallenge, postAgentsRegister } from "@/lib/api/agentRegistry";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { toast } from "sonner";

const showcase = [
  { name: "GPT-5 Fine-tuned (Legal)", model: "GPT-5", owner: "LegalAI Corp", rating: 4.9, price: "0.8 NXS/1K tok", tasks: 2340, privacy: true, status: "online" },
  { name: "Claude Analyst Pro", model: "Claude 4", owner: "DataWiz", rating: 4.7, price: "0.6 NXS/1K tok", tasks: 1820, privacy: true, status: "online" },
];

export default function AgentsPage() {
  const qc = useQueryClient();
  const api = apiBase();
  const wallet = useSolanaWallet();
  const [regLogicalId, setRegLogicalId] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regWebhookUrl, setRegWebhookUrl] = useState("");

  const liveQ = useQuery({
    queryKey: ["orchestrator", "agent-live", api],
    queryFn: fetchLiveAgents,
    refetchInterval: 4_000,
    staleTime: 2_000,
    retry: 1,
  });

  const registryQ = useQuery({
    queryKey: ["orchestrator", "agents-registry", api],
    queryFn: fetchAgentsRegistry,
    refetchInterval: 15_000,
    staleTime: 5_000,
    retry: 1,
  });

  const registerM = useMutation({
    mutationFn: async () => {
      const w = wallet.address?.trim();
      if (!w) throw new Error("Подключите кошелёк (Phantom)");
      const rawId = regLogicalId.trim();
      if (!rawId) throw new Error("Укажите logicalId (как у oracle-worker)");
      const { message, logicalId } = await postAgentsChallenge({ wallet: w, logicalId: rawId });
      const signatureBase64 = await wallet.signUtf8Message(message);
      return postAgentsRegister({
        wallet: w,
        logicalId,
        message,
        signatureBase64,
        displayName: regDisplayName.trim() || undefined,
        webhookUrl: regWebhookUrl.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Агент зарегистрирован", {
        description: "Кошелёк привязан; вебхуки при online/offline — если задан URL и секрет на сервере.",
      });
      void qc.invalidateQueries({ queryKey: ["orchestrator", "agents-registry", api] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const acceptingAgents = useMemo(
    () => (liveQ.data ?? []).filter((a) => a.accepting && !a.busy),
    [liveQ.data],
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [lastReply, setLastReply] = useState("");

  const inferM = useMutation({
    mutationFn: async () => {
      const row = (liveQ.data ?? []).find((a) => a.sessionId === selectedSessionId);
      const id = row?.logicalId?.trim() ?? "";
      if (!id) throw new Error("Выберите live-агента");
      const text = prompt.trim();
      if (!text) throw new Error("Введите сообщение");
      const temp = Number(temperature);
      return postAgentInfer({
        agentId: id,
        messages: [{ role: "user", content: text }],
        model: model.trim() || undefined,
        temperature: Number.isFinite(temp) ? temp : 0.7,
      });
    },
    onSuccess: (data) => {
      setLastReply(data.text ?? "");
      toast.success("Ответ получен", { description: data.agentLogicalId });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">AI Агенты</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Запросы: <strong className="text-foreground/90">браузер → оркестратор → WebSocket → ваш хост</strong> (
          <code className="text-[10px] bg-muted px-1 rounded">npm run oracle-worker --prefix server</code>) →{" "}
          <strong className="text-foreground/90">LM Studio</strong>. Выберите агента в статусе live и accepting.
        </p>
      </div>

      <div className="surface p-5 space-y-4 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4 text-violet-400" />
            Регистрация агента (кошелёк → logicalId)
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={registryQ.isFetching}
            onClick={() => void qc.invalidateQueries({ queryKey: ["orchestrator", "agents-registry", api] })}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${registryQ.isFetching ? "animate-spin" : ""}`} />
            Реестр
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Оркестратор проверяет подпись сообщения{" "}
          <code className="bg-muted px-0.5 rounded">escora:register-agent:…</code>. После регистрации на ваш{" "}
          <code className="bg-muted px-0.5 rounded">webhook</code> уходят события{" "}
          <code className="bg-muted px-0.5 rounded">agent.connected</code> /{" "}
          <code className="bg-muted px-0.5 rounded">agent.disconnected</code> (HMAC:{" "}
          <code className="bg-muted px-0.5 rounded">AGENT_WEBHOOK_SIGNING_SECRET</code>).
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {wallet.connected ? (
            <Badge variant="outline" className="font-mono text-[10px] gap-1">
              <Wallet className="h-3 w-3" />
              {wallet.address}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Кошелёк не подключён</span>
          )}
          <Button type="button" size="sm" variant={wallet.connected ? "outline" : "default"} disabled={wallet.connecting} onClick={() => void (wallet.connected ? wallet.disconnect() : wallet.connect())}>
            {wallet.connected ? "Отключить" : "Подключить Phantom"}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reg-logical-id">logicalId</Label>
            <Input
              id="reg-logical-id"
              value={regLogicalId}
              onChange={(e) => setRegLogicalId(e.target.value)}
              placeholder="my-oracle-worker"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-display">Отображаемое имя (опц.)</Label>
            <Input id="reg-display" value={regDisplayName} onChange={(e) => setRegDisplayName(e.target.value)} placeholder="Мой хост" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-webhook">Webhook URL (опц.)</Label>
          <Input
            id="reg-webhook"
            value={regWebhookUrl}
            onChange={(e) => setRegWebhookUrl(e.target.value)}
            placeholder="https://your-backend.example/hooks/agent"
            className="font-mono text-xs"
          />
        </div>

        <Button type="button" className="gap-2" disabled={registerM.isPending || !wallet.connected} onClick={() => registerM.mutate()}>
          {registerM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Подписать и зарегистрировать
        </Button>

        {registryQ.isError && (
          <p className="text-sm text-destructive">
            {registryQ.error instanceof Error ? registryQ.error.message : "Ошибка реестра"}
          </p>
        )}

        {(registryQ.data?.length ?? 0) > 0 && (
          <div className="rounded-md border border-border bg-muted/15 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-2 font-medium">logicalId</th>
                  <th className="p-2 font-medium">кошелёк</th>
                  <th className="p-2 font-medium">имя</th>
                </tr>
              </thead>
              <tbody>
                {(registryQ.data ?? []).map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="p-2 font-mono">{a.logicalId}</td>
                    <td className="p-2 font-mono text-[10px] max-w-[140px] truncate" title={a.walletPubkey}>
                      {a.walletPubkey}
                    </td>
                    <td className="p-2">{a.displayName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="surface p-5 space-y-4 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            Через выбранного агента
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={liveQ.isFetching}
            onClick={() => void qc.invalidateQueries({ queryKey: ["orchestrator", "agent-live", api] })}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${liveQ.isFetching ? "animate-spin" : ""}`} />
            Обновить список
          </Button>
        </div>

        {liveQ.isError && (
          <p className="text-sm text-destructive">
            {liveQ.error instanceof Error ? liveQ.error.message : "Ошибка загрузки агентов"}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Live-агент (logicalId)</Label>
            <Select
              value={selectedSessionId || "__none__"}
              onValueChange={(v) => setSelectedSessionId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите подключённый хост…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— не выбран —</SelectItem>
                {(liveQ.data ?? []).map((a) => (
                  <SelectItem key={a.sessionId} value={a.sessionId}>
                    {a.name} ({a.logicalId}){a.accepting ? "" : " · выкл."}
                    {a.busy ? " · busy" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              В списке только агенты с открытым WebSocket. Локальная панель:{" "}
              <code className="bg-muted px-0.5 rounded">npm run agent-host:panel</code> (
              <code className="bg-muted px-0.5 rounded">streamlit/agent_host_panel.py</code>
              , LM Studio + accepting) или API{" "}
              <code className="bg-muted px-0.5 rounded">/api/agent/control/accepting</code>.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="infer-model">Модель LM (опционально)</Label>
            <Input
              id="infer-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Пусто = local-model / ORACLE_LLM_MODEL на хосте"
              className="font-mono text-xs"
            />
            <Label htmlFor="infer-temp" className="text-xs text-muted-foreground">
              Temperature
            </Label>
            <Input
              id="infer-temp"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="infer-prompt">Сообщение</Label>
          <Textarea
            id="infer-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Текст уходит на бэкенд как POST /api/agent/infer → ваш агент → LM Studio…"
            className="min-h-[120px]"
          />
        </div>

        <Button
          type="button"
          className="gap-2"
          disabled={inferM.isPending || acceptingAgents.length === 0}
          onClick={() => inferM.mutate()}
          title={acceptingAgents.length === 0 ? "Нет агентов accepting или все busy" : ""}
        >
          {inferM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Отправить
        </Button>

        {acceptingAgents.length === 0 && liveQ.isSuccess && (liveQ.data?.length ?? 0) > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Все агенты сейчас с выключенным приёмом или заняты. Включите хост в Streamlit-панели.
          </p>
        )}

        {lastReply && (
          <div className="rounded-md border border-border bg-muted/20 p-3 text-sm whitespace-pre-wrap">
            {lastReply}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-heading text-sm font-semibold text-muted-foreground mb-3">Витрина (демо-мок)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showcase.map((a) => (
            <div key={a.name} className="surface p-5 opacity-80">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm">{a.name}</h3>
                    <p className="text-xs text-muted-foreground">{a.model} · {a.owner}</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full mt-1.5 bg-green-400" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                  <span className="text-sm font-medium text-foreground">{a.rating}</span>
                </div>
                {a.privacy && (
                  <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-400">
                    <Shield className="h-2.5 w-2.5 mr-0.5" /> Privacy
                  </Badge>
                )}
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-heading font-bold text-primary text-sm">{a.price}</span>
                <Button size="sm" variant="secondary" disabled className="text-xs">
                  Мок
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
