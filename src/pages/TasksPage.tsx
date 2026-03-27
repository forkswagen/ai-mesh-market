import { useState } from "react";
import { Clock, DollarSign, Users, ShieldCheck, Mic, Image, Filter, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const tasks = [
  { id: 1, title: "Пройти 1000 CAPTCHA", type: "CAPTCHA", reward: "50 USDT", deadline: "24ч", slots: 12, filled: 7, difficulty: "Лёгкая" },
  { id: 2, title: "Проверить TTS-сэмплы (500 шт.)", type: "TTS/STT", reward: "120 USDT", deadline: "48ч", slots: 5, filled: 2, difficulty: "Средняя" },
  { id: 3, title: "Аннотировать мед. снимки", type: "Аннотация", reward: "200 USDT", deadline: "72ч", slots: 20, filled: 20, difficulty: "Сложная" },
  { id: 4, title: "STT оценка EN/DE", type: "TTS/STT", reward: "80 USDT", deadline: "36ч", slots: 8, filled: 3, difficulty: "Средняя" },
  { id: 5, title: "Сегментация видеоданных", type: "Аннотация", reward: "350 USDT", deadline: "5д", slots: 10, filled: 1, difficulty: "Сложная" },
  { id: 6, title: "Cloudflare-чеки (пакет)", type: "CAPTCHA", reward: "30 USDT", deadline: "12ч", slots: 25, filled: 18, difficulty: "Лёгкая" },
  { id: 7, title: "Классификация аудио-событий", type: "TTS/STT", reward: "150 USDT", deadline: "4д", slots: 15, filled: 6, difficulty: "Средняя" },
  { id: 8, title: "Bounding boxes — автомобили", type: "Аннотация", reward: "90 USDT", deadline: "48ч", slots: 30, filled: 12, difficulty: "Лёгкая" },
];

const typeIcon: Record<string, React.ElementType> = { CAPTCHA: ShieldCheck, "TTS/STT": Mic, Аннотация: Image };
const filters = ["Все", "CAPTCHA", "TTS/STT", "Аннотация"];
const diffColors: Record<string, string> = {
  "Лёгкая": "text-green-400",
  "Средняя": "text-yellow-400",
  "Сложная": "text-red-400",
};

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState("Все");

  const filtered = activeFilter === "Все" ? tasks : tasks.filter((t) => t.type === activeFilter);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Маркетплейс задач</h1>
          <p className="text-sm text-muted-foreground mt-1">{tasks.length} активных заданий</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
          + Создать задачу
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={activeFilter === f ? "default" : "ghost"}
            className={activeFilter === f
              ? "bg-primary text-primary-foreground text-xs"
              : "text-muted-foreground text-xs hover:text-foreground"}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="surface overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_100px_90px_80px_100px_80px_100px] gap-4 px-4 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
          <span>Задача</span>
          <span>Тип</span>
          <span>Награда</span>
          <span>Срок</span>
          <span>Слоты</span>
          <span>Уровень</span>
          <span></span>
        </div>

        {filtered.map((task) => {
          const Icon = typeIcon[task.type] || ShieldCheck;
          const full = task.filled >= task.slots;
          return (
            <div
              key={task.id}
              className="grid grid-cols-[1fr_100px_90px_80px_100px_80px_100px] gap-4 px-4 py-3.5 items-center border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground w-fit">{task.type}</Badge>
              <span className="text-sm font-medium text-primary">{task.reward}</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{task.deadline}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-muted rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(task.filled / task.slots) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{task.filled}/{task.slots}</span>
              </div>
              <span className={`text-xs font-medium ${diffColors[task.difficulty]}`}>{task.difficulty}</span>
              <Button size="sm" disabled={full} className={full ? "bg-muted text-muted-foreground text-xs" : "bg-primary text-primary-foreground text-xs hover:bg-primary/90"}>
                {full ? "Занято" : "Взять"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
