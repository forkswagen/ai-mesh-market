import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  Cable,
  Link2,
  Loader2,
  RefreshCw,
  Send,
  Server,
  Star,
  Shield,
  Wallet,
} from "lucide-react";
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
import { apiBase, apiUrl } from "@/lib/api/env";
import { fetchLiveAgents } from "@/lib/api/agentLive";
import { postAgentInfer } from "@/lib/api/agentInfer";
import { fetchAgentsRegistry, postAgentsChallenge, postAgentsRegister } from "@/lib/api/agentRegistry";
import { fetchApiHealth } from "@/lib/api/health";
import { fetchApiMeta } from "@/lib/api/meta";
import {
  frontendUrlAsOrchestratorApiMessage,
  missingViteApiBaseUrlMessage,
  orchestratorConnectionHint,
} from "@/lib/api/connectionHints";
import { wrongOrchestratorUrlMessage } from "@/lib/api/backendOrigin";
import { SolTolokaPanel } from "@/components/agents/SolTolokaPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { toast } from "sonner";

const showcase = [
  { name: "GPT-5 Fine-tuned (Legal)", model: "GPT-5", owner: "LegalAI Corp", rating: 4.9, price: "0.8 NXS/1K tok", tasks: 2340, privacy: true, status: "online" },
  { name: "Claude Analyst Pro", model: "Claude 4", owner: "DataWiz", rating: 4.7, price: "0.6 NXS/1K tok", tasks: 1820, privacy: true, status: "online" },
];

export default function AgentsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "soltoloka" ? "soltoloka" : "escora";
  const setTab = (v: string) => {
    if (v === "soltoloka") setSearchParams({ tab: "soltoloka" }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const api = apiBase();
  const orchestratorReady = Boolean(api);
  const escoraConfigBanner =
    wrongOrchestratorUrlMessage() ||
    frontendUrlAsOrchestratorApiMessage() ||
    (!orchestratorReady ? missingViteApiBaseUrlMessage() : "");
  const wallet = useSolanaWallet();
  const [regLogicalId, setRegLogicalId] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regWebhookUrl, setRegWebhookUrl] = useState("");

  const healthQ = useQuery({
    queryKey: ["api", "health", api],
    queryFn: fetchApiHealth,
    enabled: orchestratorReady,
    refetchInterval: 20_000,
    staleTime: 5_000,
    retry: 1,
  });

  const metaQ = useQuery({
    queryKey: ["api", "meta", api],
    queryFn: fetchApiMeta,
    enabled: orchestratorReady,
    refetchInterval: 30_000,
    staleTime: 10_000,
    retry: 1,
  });

  const liveQ = useQuery({
    queryKey: ["orchestrator", "agent-live", api],
    queryFn: fetchLiveAgents,
    enabled: orchestratorReady,
    refetchInterval: 4_000,
    staleTime: 2_000,
    retry: 1,
  });

  const registryQ = useQuery({
    queryKey: ["orchestrator", "agents-registry", api],
    queryFn: fetchAgentsRegistry,
    enabled: orchestratorReady,
    refetchInterval: 15_000,
    staleTime: 5_000,
    retry: 1,
  });

  const registerM = useMutation({
    mutationFn: async () => {
      const w = wallet.address?.trim();
      if (!w) throw new Error("Connect wallet (Phantom)");
      const rawId = regLogicalId.trim();
      if (!rawId) throw new Error("Enter logicalId (same as oracle-worker)");
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
      toast.success("Agent registered", {
        description: "Wallet linked; online/offline webhooks fire when URL and signing secret are set on the server.",
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
      if (!id) throw new Error("Select a live agent");
      const text = prompt.trim();
      if (!text) throw new Error("Enter a message");
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
      toast.success("Reply received", { description: data.agentLogicalId });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const liveCount = liveQ.data?.length ?? 0;
  const acceptingCount = acceptingAgents.length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap">
          <Bot className="h-8 w-8 text-primary shrink-0" />
          Agents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          One screen: <strong className="text-foreground/90">Escora</strong> (Node orchestrator + WebSocket + LM Studio) and{" "}
          <strong className="text-foreground/90">SolToloka</strong> (GPU nodes, separate FastAPI). Server connectivity — panel below.
        </p>
      </div>

      {escoraConfigBanner && (
        <div className="surface p-4 border border-amber-500/35 bg-amber-500/5 text-sm space-y-2">
          <p className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-600" />
            Escora orchestrator (separate backend)
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{escoraConfigBanner}</p>
          <p className="text-xs text-muted-foreground">
            Tab <strong className="text-foreground/90">SolToloka · GPU</strong> uses a different API (can work via proxy without{" "}
            <code className="bg-muted px-0.5 rounded">VITE_API_BASE_URL</code>).
          </p>
        </div>
      )}

      {orchestratorReady && (
      <div
        className={`surface p-4 border text-sm ${
          healthQ.isError ? "border-destructive/40 bg-destructive/5" : healthQ.isSuccess ? "border-green-500/30 bg-green-500/5" : "border-border"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Activity className={`h-4 w-4 ${healthQ.isSuccess ? "text-green-500" : healthQ.isError ? "text-destructive" : "text-muted-foreground"}`} />
          <span className="font-heading font-semibold text-foreground">Escora orchestrator connectivity</span>
          <code className="text-[10px] bg-muted px-1 rounded truncate max-w-[220px]" title={api || undefined}>
            {api || "—"}
          </code>
        </div>
        {healthQ.isLoading && (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            GET /health…
          </p>
        )}
        {healthQ.isError && (
          <div className="text-destructive text-xs space-y-1">
            <p>{(healthQ.error as Error).message}</p>
            {!(healthQ.error as Error).message.includes("VITE_API_BASE_URL") && (
              <p className="text-muted-foreground">{orchestratorConnectionHint()}</p>
            )}
          </div>
        )}
        {healthQ.isSuccess && (
          <div className="grid gap-1 text-xs sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">/health:</span>{" "}
              <span className="text-foreground">{healthQ.data?.app ?? healthQ.data?.status ?? "ok"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">GET /api/meta:</span>{" "}
              {metaQ.isSuccess ? (
                <span className="text-foreground">revision {metaQ.data?.apiRevision ?? "—"} · {metaQ.data?.db ?? "db"}</span>
              ) : metaQ.isError ? (
                <span className="text-destructive">{(metaQ.error as Error).message}</span>
              ) : (
                <span className="text-muted-foreground">…</span>
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Live agents (WS):</span>{" "}
              <span className="text-foreground">{liveQ.isSuccess ? liveCount : "…"}</span>
              {liveQ.isSuccess && (
                <span className="text-muted-foreground"> · accepting &amp; idle: {acceptingCount}</span>
              )}
            </p>
            <p className="text-muted-foreground sm:col-span-2">
              Manual check:{" "}
              <a className="text-primary hover:underline" href={api ? apiUrl("/api/meta") : "#"} target="_blank" rel="noreferrer">
                /api/meta
              </a>
            </p>
          </div>
        )}
      </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="escora" className="gap-1.5">
            <Server className="h-3.5 w-3.5" />
            Escora · LM
          </TabsTrigger>
          <TabsTrigger value="soltoloka" className="gap-1.5">
            <Cable className="h-3.5 w-3.5" />
            SolToloka · GPU
          </TabsTrigger>
        </TabsList>

        <TabsContent value="soltoloka" className="mt-6 space-y-4">
          <SolTolokaPanel />
        </TabsContent>

        <TabsContent value="escora" className="mt-6 space-y-6">
      <div className="surface p-5 space-y-4 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4 text-violet-400" />
            Agent registration (wallet → logicalId)
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={registryQ.isFetching || !orchestratorReady}
            onClick={() => void qc.invalidateQueries({ queryKey: ["orchestrator", "agents-registry", api] })}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${registryQ.isFetching ? "animate-spin" : ""}`} />
            Registry
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The orchestrator verifies the message signature{" "}
          <code className="bg-muted px-0.5 rounded">escora:register-agent:…</code>. After registration your{" "}
          <code className="bg-muted px-0.5 rounded">webhook</code> receives{" "}
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
            <span className="text-xs text-muted-foreground">Wallet not connected</span>
          )}
          <Button type="button" size="sm" variant={wallet.connected ? "outline" : "default"} disabled={wallet.connecting} onClick={() => void (wallet.connected ? wallet.disconnect() : wallet.connect())}>
            {wallet.connected ? "Disconnect" : "Connect Phantom"}
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
            <Label htmlFor="reg-display">Display name (optional)</Label>
            <Input id="reg-display" value={regDisplayName} onChange={(e) => setRegDisplayName(e.target.value)} placeholder="My host" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-webhook">Webhook URL (optional)</Label>
          <Input
            id="reg-webhook"
            value={regWebhookUrl}
            onChange={(e) => setRegWebhookUrl(e.target.value)}
            placeholder="https://your-backend.example/hooks/agent"
            className="font-mono text-xs"
          />
        </div>

        <Button
          type="button"
          className="gap-2"
          disabled={registerM.isPending || !wallet.connected || !orchestratorReady}
          onClick={() => registerM.mutate()}
        >
          {registerM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Sign and register
        </Button>

        {registryQ.isError && (
          <p className="text-sm text-destructive">
            {registryQ.error instanceof Error ? registryQ.error.message : "Registry error"}
          </p>
        )}

        {(registryQ.data?.length ?? 0) > 0 && (
          <div className="rounded-md border border-border bg-muted/15 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-2 font-medium">logicalId</th>
                  <th className="p-2 font-medium">wallet</th>
                  <th className="p-2 font-medium">name</th>
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
            Via selected agent
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={liveQ.isFetching || !orchestratorReady}
            onClick={() => void qc.invalidateQueries({ queryKey: ["orchestrator", "agent-live", api] })}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${liveQ.isFetching ? "animate-spin" : ""}`} />
            Refresh list
          </Button>
        </div>

        {!orchestratorReady && (
          <p className="text-sm text-muted-foreground">
            Live agents are fetched from the Escora orchestrator — set{" "}
            <code className="bg-muted px-1 rounded text-xs">VITE_API_BASE_URL</code> and rebuild the frontend (see panel above).
          </p>
        )}
        {orchestratorReady && liveQ.isError && (
          <p className="text-sm text-destructive">
            {liveQ.error instanceof Error ? liveQ.error.message : "Failed to load agents"}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Live agent (logicalId)</Label>
            <Select
              disabled={!orchestratorReady}
              value={selectedSessionId || "__none__"}
              onValueChange={(v) => setSelectedSessionId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a connected host…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— none —</SelectItem>
                {(liveQ.data ?? []).map((a) => (
                  <SelectItem key={a.sessionId} value={a.sessionId}>
                    {a.name} ({a.logicalId}){a.accepting ? "" : " · off"}
                    {a.busy ? " · busy" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Only agents with an open WebSocket appear here. Local panel:{" "}
              <code className="bg-muted px-0.5 rounded">npm run agent-host:panel</code> (
              <code className="bg-muted px-0.5 rounded">streamlit/agent_host_panel.py</code>
              , LM Studio + accepting) or API{" "}
              <code className="bg-muted px-0.5 rounded">/api/agent/control/accepting</code>.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="infer-model">LM model (optional)</Label>
            <Input
              id="infer-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Empty = local-model / ORACLE_LLM_MODEL on host"
              className="font-mono text-xs"
              disabled={!orchestratorReady}
            />
            <Label htmlFor="infer-temp" className="text-xs text-muted-foreground">
              Temperature
            </Label>
            <Input
              id="infer-temp"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="font-mono text-xs"
              disabled={!orchestratorReady}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="infer-prompt">Message</Label>
          <Textarea
            id="infer-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Text is sent to the backend as POST /api/agent/infer → your agent → LM Studio…"
            className="min-h-[120px]"
            disabled={!orchestratorReady}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="gap-2"
            disabled={inferM.isPending || acceptingAgents.length === 0 || !orchestratorReady}
            onClick={() => inferM.mutate()}
            title={
              !orchestratorReady
                ? "Set VITE_API_BASE_URL"
                : acceptingAgents.length === 0
                  ? "No accepting agents or all busy"
                  : ""
            }
          >
            {inferM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={acceptingAgents.length === 0 || !orchestratorReady}
            onClick={() => {
              const first = acceptingAgents[0];
              if (first) setSelectedSessionId(first.sessionId);
              setPrompt("ping");
              toast.message("Prefilled: first accepting agent and “ping” — click Send.");
            }}
          >
            Test: ping
          </Button>
        </div>

        {acceptingAgents.length === 0 && liveQ.isSuccess && (liveQ.data?.length ?? 0) > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            All agents have accepting off or are busy. Enable the host in the Streamlit panel.
          </p>
        )}

        {lastReply && (
          <div className="rounded-md border border-border bg-muted/20 p-3 text-sm whitespace-pre-wrap">
            {lastReply}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-heading text-sm font-semibold text-muted-foreground mb-3">Showcase (demo mock)</h2>
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
                  Mock
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
