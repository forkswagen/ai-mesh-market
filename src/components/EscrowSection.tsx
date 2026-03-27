import { motion } from "framer-motion";
import { Lock, Bot, CheckCircle, ArrowDown, AlertTriangle, Scale } from "lucide-react";

const steps = [
  {
    icon: Lock,
    title: "Заморозка средств",
    desc: "Заказчик размещает задачу — средства блокируются в смарт-контракте",
  },
  {
    icon: CheckCircle,
    title: "Выполнение",
    desc: "Исполнитель загружает результат: файлы, логи, скриншоты",
  },
  {
    icon: Bot,
    title: "AI Judge",
    desc: "Многоагентная система оценивает качество (BLEU, ROUGE, IoU, CER/WER)",
  },
  {
    icon: Scale,
    title: "Вердикт",
    desc: "«Выполнено», «частично», «не выполнено» — средства распределяются автоматически",
  },
];

export default function EscrowSection() {
  return (
    <section id="escrow" className="py-24 relative cyber-grid">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Smart Contract <span className="text-gradient">Escrow</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AI-арбитраж с dispute window 24–48ч и эскалацией на human-арбитров
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="flex items-start gap-5 mb-2">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center glow-border">
                    <step.icon size={22} className="text-primary" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px h-12 bg-border my-2 relative">
                      <ArrowDown size={14} className="text-primary absolute -bottom-1 left-1/2 -translate-x-1/2" />
                    </div>
                  )}
                </div>
                <div className="pt-2 pb-6">
                  <h3 className="font-heading font-semibold text-foreground text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="glass rounded-xl p-5 mt-4 glow-border"
          >
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={18} className="text-primary" />
              <h4 className="font-heading font-semibold text-foreground">Dispute Window</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              24–48 часов на апелляцию. При спорном случае — эскалация на доверенных human-арбитров. 
              Все логи хранятся в блокчейне.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
