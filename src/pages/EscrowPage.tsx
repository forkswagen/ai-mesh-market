import { Lock, CheckCircle, Bot, Scale, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DATA_ARBITER_PROGRAM_ID, AI_JUDGE_MAX_REASON_BYTES } from "@/lib/solana/escrow";

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
  { icon: Lock, title: "Инициализация", desc: "initialize_escrow · PDA escrow[buyer,seller,deal_id]" },
  { icon: CheckCircle, title: "Депозит", desc: "deposit — покупатель блокирует SOL в PDA" },
  { icon: Bot, title: "Датасет", desc: "submit_dataset_hash — хэш загрузки (off-chain файл)" },
  { icon: Scale, title: "AI Judge", desc: "ai_judge(verdict, reason) — любой подписант, атомарный payout" },
];

const onChainIx = [
  "initialize_escrow(deal_id, amount, expected_hash, judge_authority?)",
  "deposit()",
  "submit_dataset_hash([u8;32])",
  `ai_judge(deal_id, verdict, reason) · reason ≤ ${AI_JUDGE_MAX_REASON_BYTES} bytes`,
  "release_to_seller / refund_buyer — только если задан judge_authority",
];

export default function EscrowPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Escrow · NexusAI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          UI-маркетплейс + Solana-программа <span className="text-foreground/90">data_arbiter</span> (devnet): эскроу SOL → хэш датасета → автономный{" "}
          <code className="text-xs bg-muted px-1 rounded">ai_judge</code>
        </p>
      </div>

      <div className="surface p-5 space-y-3 border-primary/20">
        <h2 className="font-heading font-semibold text-foreground text-sm">Program ID (devnet)</h2>
        <p className="text-xs font-mono break-all text-primary">{DATA_ARBITER_PROGRAM_ID.toBase58()}</p>
        <p className="text-xs text-muted-foreground">
          Клиентские хелперы: <code className="bg-muted px-1 rounded">src/lib/solana/escrow.ts</code> · оффчейн проверки:{" "}
          <code className="bg-muted px-1 rounded">src/lib/judge/datasetJudge.ts</code> · IDL после{" "}
          <code className="bg-muted px-1 rounded">anchor build</code>
        </p>
      </div>

      <div className="surface p-5">
        <h2 className="font-heading font-semibold text-foreground mb-4">Поток on-chain</h2>
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
          <h2 className="font-heading font-semibold text-foreground">Демо-транзакции (мок)</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Живые сделки — после подключения Anchor-клиента
          </div>
        </div>
        <div className="grid grid-cols-[60px_1fr_100px_100px_90px_80px] gap-4 px-4 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
          <span>ID</span>
          <span>Задача</span>
          <span>Сумма</span>
          <span>Статус</span>
          <span>AI Judge</span>
          <span>Время</span>
        </div>
        {escrows.map((e) => {
          const st = statusConfig[e.status];
          return (
            <div
              key={e.id}
              className="grid grid-cols-[60px_1fr_100px_100px_90px_80px] gap-4 px-4 py-3.5 items-center border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <span className="text-xs font-mono text-muted-foreground">{e.id}</span>
              <span className="text-sm text-foreground truncate">{e.task}</span>
              <span className="text-sm font-medium text-primary">{e.amount}</span>
              <Badge variant="outline" className={`text-[10px] w-fit ${st.cls}`}>
                {st.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{e.judge}</span>
              <span className="text-xs text-muted-foreground">{e.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
