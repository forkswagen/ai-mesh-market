import { Bot, Shield, Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgents, useInvokeAgent } from "@/hooks/use-api";
import { toast } from "sonner";

export default function AgentsPage() {
  const { data: agents, isLoading, error } = useAgents();
  const invokeAgent = useInvokeAgent();

  const handleInvoke = (agentId: string) => {
    invokeAgent.mutate(
      { agentId, payload: "test" },
      {
        onSuccess: () => toast.success("Агент вызван!"),
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

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

      {isLoading ? (
        <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-destructive">Ошибка: {(error as Error).message}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(agents ?? []).map((a) => (
            <div key={a.id} className="surface p-5 hover-lift cursor-pointer group">
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
                <span className="text-xs text-muted-foreground">{a.tasks_completed.toLocaleString()} задач</span>
                {a.privacy && (
                  <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-400">
                    <Shield className="h-2.5 w-2.5 mr-0.5" /> Privacy
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="font-heading font-bold text-primary text-sm">{a.price}</span>
                <Button
                  size="sm"
                  disabled={a.status === "offline" || invokeAgent.isPending}
                  onClick={() => handleInvoke(a.id)}
                  className={a.status === "offline" ? "bg-muted text-muted-foreground text-xs" : "bg-primary text-primary-foreground text-xs hover:bg-primary/90"}
                >
                  {a.status === "offline" ? "Оффлайн" : "Использовать"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
