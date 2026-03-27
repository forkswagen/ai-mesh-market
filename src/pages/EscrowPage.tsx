import { Lock, CheckCircle, Bot, Scale, AlertTriangle, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const escrows = [
  { id: "#4421", task: "CAPTCHA пакет x1000", amount: "50 USDT", status: "locked", judge: "pending", time: "2ч назад" },
  { id: "#4398", task: "TTS оценка RU-модель", amount: "120 USDT", status: "released", judge: "100%", time: "14 мин назад" },
  { id: "#4385", task: "Аннотация мед. снимков", amount: "200 USDT", status: "locked", judge: "pending", time: "1д назад" },
  { id: "#4372", task: "STT проверка EN/DE", amount: "80 USDT", status: "released", judge: "95%", time: "3ч назад" },
  { id: "#4350", task: "Сегментация видео", amount: "350 USDT", status: "disputed", judge: "partial", time: "2д назад" },
  { id: "#4305", task: "Cloudflare bypass x500", amount: "25 USDT", status: "refunded", judge: "rejected", time: "5д назад" },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  locked: { label: "Заморожено", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  released: { label: "Выплачено", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  disputed: { label: "Спор", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  refunded: { label: "Возврат", cls: "bg-muted text-muted-foreground border-border" },
};

const steps = [
  { icon: Lock, title: "Заморозка средств", desc: "Средства блокируются в смарт-контракте" },
  { icon: CheckCircle, title: "Выполнение", desc: "Исполнитель загружает результат" },
  { icon: Bot, title: "AI Judge", desc: "Оценка качества (BLEU, ROUGE, IoU)" },
  { icon: Scale, title: "Вердикт и выплата", desc: "Автоматическое распределение средств" },
];

export default function EscrowPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Escrow и арбитраж</h1>
        <p className="text-sm text-muted-foreground mt-1">Смарт-контракт с AI-арбитражем</p>
      </div>

      {/* Pipeline */}
      <div className="surface p-5">
        <h2 className="font-heading font-semibold text-foreground mb-4">Процесс</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2.5 bg-muted rounded-lg px-4 py-3">
                <s.icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="surface overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-semibold text-foreground">Транзакции</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Dispute window: 24–48ч
          </div>
        </div>
        <div className="grid grid-cols-[60px_1fr_100px_100px_90px_80px] gap-4 px-4 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
          <span>ID</span><span>Задача</span><span>Сумма</span><span>Статус</span><span>AI Judge</span><span>Время</span>
        </div>
        {escrows.map((e) => {
          const st = statusConfig[e.status];
          return (
            <div key={e.id} className="grid grid-cols-[60px_1fr_100px_100px_90px_80px] gap-4 px-4 py-3.5 items-center border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
              <span className="text-xs font-mono text-muted-foreground">{e.id}</span>
              <span className="text-sm text-foreground truncate">{e.task}</span>
              <span className="text-sm font-medium text-primary">{e.amount}</span>
              <Badge variant="outline" className={`text-[10px] w-fit ${st.cls}`}>{st.label}</Badge>
              <span className="text-xs text-muted-foreground">{e.judge}</span>
              <span className="text-xs text-muted-foreground">{e.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
