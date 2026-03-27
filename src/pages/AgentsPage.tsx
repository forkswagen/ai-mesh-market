import { Bot, Zap, Shield, Clock, Star, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const agents = [
  { name: "GPT-5 Fine-tuned (Legal)", model: "GPT-5", owner: "LegalAI Corp", rating: 4.9, price: "0.8 NXS/1K tok", tasks: 2340, privacy: true, status: "online" },
  { name: "Claude Analyst Pro", model: "Claude 4", owner: "DataWiz", rating: 4.7, price: "0.6 NXS/1K tok", tasks: 1820, privacy: true, status: "online" },
  { name: "Llama-3 Code Assistant", model: "Llama 3", owner: "CodeForge", rating: 4.5, price: "0.3 NXS/1K tok", tasks: 5100, privacy: false, status: "online" },
  { name: "Grok Research Bot", model: "Grok", owner: "ResearchDAO", rating: 4.8, price: "1.2 NXS/1K tok", tasks: 890, privacy: true, status: "offline" },
  { name: "Whisper Transcriber", model: "Whisper v4", owner: "AudioTech", rating: 4.6, price: "0.15 NXS/min", tasks: 12400, privacy: false, status: "online" },
  { name: "Vision Annotator", model: "GPT-5V", owner: "PixelAI", rating: 4.4, price: "0.5 NXS/image", tasks: 3200, privacy: false, status: "online" },
];

export default function AgentsPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">AI Агенты</h1>
          <p className="text-sm text-muted-foreground mt-1">Аренда и использование AI-агентов по API</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
          + Выставить агента
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((a) => (
          <div key={a.name} className="surface p-5 hover-lift cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{a.name}</h3>
                  <p className="text-xs text-muted-foreground">{a.model} · {a.owner}</p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full mt-1.5 ${a.status === "online" ? "bg-green-400" : "bg-muted-foreground"}`} />
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="text-sm font-medium text-foreground">{a.rating}</span>
              </div>
              <span className="text-xs text-muted-foreground">{a.tasks.toLocaleString()} задач</span>
              {a.privacy && (
                <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-400">
                  <Shield className="h-2.5 w-2.5 mr-0.5" /> Privacy
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="font-heading font-bold text-primary text-sm">{a.price}</span>
              <Button size="sm" disabled={a.status === "offline"} className={a.status === "offline" ? "bg-muted text-muted-foreground text-xs" : "bg-primary text-primary-foreground text-xs hover:bg-primary/90"}>
                {a.status === "offline" ? "Оффлайн" : "Использовать"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
