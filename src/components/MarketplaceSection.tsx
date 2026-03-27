import { motion } from "framer-motion";
import { Clock, DollarSign, Users, CheckCircle, Image, Mic, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const tasks = [
  {
    title: "Пройти 1000 CAPTCHA",
    type: "CAPTCHA",
    reward: "50 USDT",
    deadline: "24ч",
    slots: 12,
    filled: 7,
    status: "active",
  },
  {
    title: "Проверить TTS-сэмплы (500 шт.)",
    type: "TTS/STT",
    reward: "120 USDT",
    deadline: "48ч",
    slots: 5,
    filled: 2,
    status: "active",
  },
  {
    title: "Аннотировать изображения",
    type: "Аннотация",
    reward: "200 USDT",
    deadline: "72ч",
    slots: 20,
    filled: 20,
    status: "completed",
  },
  {
    title: "Оценить качество STT",
    type: "TTS/STT",
    reward: "80 USDT",
    deadline: "36ч",
    slots: 8,
    filled: 3,
    status: "active",
  },
  {
    title: "Сегментация видеоданных",
    type: "Аннотация",
    reward: "350 USDT",
    deadline: "5д",
    slots: 10,
    filled: 1,
    status: "active",
  },
  {
    title: "Cloudflare-чеки (пакет)",
    type: "CAPTCHA",
    reward: "30 USDT",
    deadline: "12ч",
    slots: 25,
    filled: 18,
    status: "active",
  },
];

const typeIcon: Record<string, React.ElementType> = {
  CAPTCHA: ShieldCheck,
  "TTS/STT": Mic,
  Аннотация: Image,
};

export default function MarketplaceSection() {
  return (
    <section id="marketplace" className="py-24 relative cyber-grid">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Маркетплейс <span className="text-gradient">задач</span>
          </h2>
          <p className="text-muted-foreground text-lg">Микро-задания с автоматическим escrow</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {tasks.map((task, i) => {
            const Icon = typeIcon[task.type] || ShieldCheck;
            const isFull = task.filled >= task.slots;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="glass rounded-xl p-5 hover-glow flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-primary" />
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {task.type}
                    </Badge>
                  </div>
                  <Badge
                    className={`text-xs ${isFull ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border-primary/20"}`}
                    variant="outline"
                  >
                    {isFull ? "Заполнено" : "Активно"}
                  </Badge>
                </div>

                <h3 className="font-heading font-semibold text-foreground mb-3">{task.title}</h3>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 mt-auto">
                  <span className="flex items-center gap-1"><DollarSign size={14} className="text-primary" />{task.reward}</span>
                  <span className="flex items-center gap-1"><Clock size={14} />{task.deadline}</span>
                  <span className="flex items-center gap-1"><Users size={14} />{task.filled}/{task.slots}</span>
                </div>

                <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${(task.filled / task.slots) * 100}%` }}
                  />
                </div>

                <Button
                  size="sm"
                  disabled={isFull}
                  className={isFull ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                >
                  {isFull ? "Мест нет" : "Взять задание"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
