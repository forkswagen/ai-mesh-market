import { Cpu, Server, Zap, Clock, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const nodes = [
  { name: "GPU Node Alpha", gpu: "RTX 4090 x4", vram: "96 GB", price: "2.4 NXS/hr", location: "EU-West", uptime: "99.8%", status: "available" },
  { name: "Cluster Omega", gpu: "A100 x8", vram: "640 GB", price: "12 NXS/hr", location: "US-East", uptime: "99.9%", status: "available" },
  { name: "Edge Node Beta", gpu: "RTX 3090 x2", vram: "48 GB", price: "1.1 NXS/hr", location: "Asia", uptime: "98.5%", status: "busy" },
  { name: "Mega Train Node", gpu: "H100 x4", vram: "320 GB", price: "28 NXS/hr", location: "US-West", uptime: "99.9%", status: "available" },
  { name: "Budget GPU", gpu: "RTX 3060 x1", vram: "12 GB", price: "0.3 NXS/hr", location: "EU-Central", uptime: "97.2%", status: "available" },
  { name: "Fine-tune Express", gpu: "A100 x2", vram: "160 GB", price: "6.5 NXS/hr", location: "EU-North", uptime: "99.7%", status: "busy" },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  available: { label: "Доступен", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  busy: { label: "Занят", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

export default function ComputePage() {
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
          { label: "Всего узлов", value: "342", icon: Server },
          { label: "Доступно сейчас", value: "218", icon: Zap },
          { label: "Ср. цена GPU-hr", value: "3.2 NXS", icon: Clock },
        ].map((s) => (
          <div key={s.label} className="surface p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-heading text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_100px_90px_80px_90px] gap-4 px-4 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
          <span>Узел</span><span>GPU</span><span>VRAM</span><span>Цена</span><span>Регион</span><span>Uptime</span><span></span>
        </div>
        {nodes.map((n) => {
          const st = statusMap[n.status];
          return (
            <div key={n.name} className="grid grid-cols-[1fr_120px_80px_100px_90px_80px_90px] gap-4 px-4 py-3.5 items-center border-b border-border/50 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <Cpu className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{n.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{n.gpu}</span>
              <span className="text-xs text-foreground">{n.vram}</span>
              <span className="text-sm font-medium text-primary">{n.price}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{n.location}</span>
              <span className="text-xs text-foreground">{n.uptime}</span>
              <Button size="sm" disabled={n.status === "busy"} className={n.status === "busy" ? "bg-muted text-muted-foreground text-xs" : "bg-primary text-primary-foreground text-xs hover:bg-primary/90"}>
                {n.status === "busy" ? "Занят" : "Арендовать"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
