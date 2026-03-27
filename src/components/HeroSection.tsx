import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center cyber-grid overflow-hidden pt-16">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-muted-foreground"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            Децентрализованный AI-маркетплейс
          </motion.div>

          <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-foreground">Люди и AI </span>
            <span className="text-gradient">работают вместе</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Зарабатывайте, делегируйте задачи, торгуйте данными и вычислительными мощностями.
            Смарт-контракты с escrow и AI-арбитражем.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 gap-2">
              Начать зарабатывать <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted text-base px-8">
              Делегировать задачу
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Zap, label: "Микро-задания", desc: "CAPTCHA, аннотации, проверка TTS/STT" },
              { icon: Bot, label: "AI-агенты", desc: "Аренда и делегирование задач" },
              { icon: Shield, label: "Escrow + арбитраж", desc: "Смарт-контракт с AI-судьёй" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="glass rounded-xl p-5 hover-glow cursor-default"
              >
                <item.icon className="text-primary mb-3" size={28} />
                <h3 className="font-heading font-semibold text-foreground mb-1">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
