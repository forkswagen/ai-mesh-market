import { Cpu, Server, Zap, Clock, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useComputeNodes, useRentNode } from "@/hooks/use-api";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; cls: string }> = {
  available: { label: "Доступен", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  busy: { label: "Занят", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

export default function ComputePage() {
  const { data: nodes, isLoading, error } = useComputeNodes();
  const rentNode = useRentNode();

  const handleRent = (nodeId: string) => {
    rentNode.mutate(
      { node_id: nodeId, job_config: {}, hours_requested: 1 },
      {
        onSuccess: () => toast.success("Нода арендована!"),
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Вычислительные мощности</h1>
          <p className="text-sm text-muted-foreground mt-1">Аренда GPU для тренировки и инференса</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
          + Предоставить мощности
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Всего узлов", value: nodes?.length?.toString() ?? "—", icon: Server },
          { label: "Доступно сейчас", value: nodes?.filter((n) => n.status === "available").length?.toString() ?? "—", icon: Zap },
          { label: "Ср. цена GPU-hr", value: nodes && nodes.length > 0 ? `${(nodes.reduce((s, n) => s + n.price_per_hour, 0) / nodes.length).toFixed(1)} SOL` : "—", icon: Clock },
        ].map((s) => (
          <div key={s.label} className="surface p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-heading text-xl font-bold text-foreground">{isLoading ? "..." : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_100px_90px_80px_90px] gap-4 px-4 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
          <span>Узел</span><span>GPU</span><span>VRAM</span><span>Цена</span><span>Регион</span><span>Uptime</span><span></span>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">Ошибка: {(error as Error).message}</div>
        ) : nodes && nodes.length > 0 ? (
          nodes.map((n) => {
            const st = statusMap[n.status] || statusMap.available;
            return (
              <div key={n.id} className="grid grid-cols-[1fr_120px_80px_100px_90px_80px_90px] gap-4 px-4 py-3.5 items-center border-b border-border/50 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Cpu className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{n.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{n.gpu_model}</span>
                <span className="text-xs text-foreground">{n.vram_gb} GB</span>
                <span className="text-sm font-medium text-primary">{n.price_per_hour} SOL/hr</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{n.location}</span>
                <span className="text-xs text-foreground">{(n.uptime * 100).toFixed(1)}%</span>
                <Button
                  size="sm"
                  disabled={n.status === "busy" || rentNode.isPending}
                  onClick={() => handleRent(n.id)}
                  className={n.status === "busy" ? "bg-muted text-muted-foreground text-xs" : "bg-primary text-primary-foreground text-xs hover:bg-primary/90"}
                >
                  {n.status === "busy" ? "Занят" : "Арендовать"}
                </Button>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">Нет доступных узлов</div>
        )}
      </div>
    </div>
  );
}
