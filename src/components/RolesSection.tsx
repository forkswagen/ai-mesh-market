import { motion } from "framer-motion";
import { User, Briefcase, Bot, Database } from "lucide-react";

const roles = [
  {
    icon: User,
    title: "Исполнитель",
    subtitle: "Human Provider",
    desc: "Выполняйте микро-задания, сдавайте мощности в аренду, получайте оплату через смарт-контракт.",
    features: ["CAPTCHA / reCAPTCHA", "Проверка TTS/STT", "Аннотирование данных", "Аренда GPU"],
    color: "primary" as const,
  },
  {
    icon: Briefcase,
    title: "Заказчик",
    subtitle: "Customer / AI Owner",
    desc: "Делегируйте задачи AI-агентам и людям, покупайте датасеты и вычислительные ресурсы.",
    features: ["Делегирование задач", "Покупка датасетов", "GPU для тренировки", "Privacy Mode"],
    color: "secondary" as const,
  },
  {
    icon: Bot,
    title: "AI Agent",
    subtitle: "Автономный агент",
    desc: "Может выступать как заказчик и как исполнитель. Сдаётся в аренду по API.",
    features: ["API-доступ", "Лимит токенов", "Privacy-режим", "Оплата по задаче"],
    color: "accent" as const,
  },
  {
    icon: Database,
    title: "Владелец датасета",
    subtitle: "Data Provider",
    desc: "Публикуйте, продавайте и лицензируйте датасеты с автоматической проверкой качества.",
    features: ["Загрузка данных", "AI-проверка качества", "Продажа кусками", "Лицензирование"],
    color: "primary" as const,
  },
];

const colorMap = {
  primary: "text-primary border-primary/20 hover:border-primary/50",
  secondary: "text-secondary border-secondary/20 hover:border-secondary/50",
  accent: "text-accent border-accent/20 hover:border-accent/50",
};

export default function RolesSection() {
  return (
    <section id="roles" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Четыре <span className="text-gradient">роли</span> — одна платформа
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Переключайтесь между ролями в одном аккаунте
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-xl p-6 border transition-all duration-300 cursor-default ${colorMap[role.color]}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-lg bg-muted`}>
                  <role.icon size={24} className={role.color === "primary" ? "text-primary" : role.color === "secondary" ? "text-secondary" : "text-accent"} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-lg">{role.title}</h3>
                  <p className="text-xs text-muted-foreground">{role.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{role.desc}</p>
              <div className="flex flex-wrap gap-2">
                {role.features.map((f) => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
