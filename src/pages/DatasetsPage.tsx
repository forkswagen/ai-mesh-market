import { useState } from "react";
import { FileText, Image, Mic, Layers, Star, Download, Search, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const datasets = [
  { name: "ImageNet-XL Annotations", type: "Изображения", icon: Image, size: "2.3M записей", quality: 4.8, price: "500 NXS", tags: ["CV", "Classification"], seller: "DataLab" },
  { name: "Multilingual TTS Corpus", type: "Аудио", icon: Mic, size: "890K сэмплов", quality: 4.5, price: "320 NXS", tags: ["TTS", "Multilingual"], seller: "VoiceForge" },
  { name: "Reddit QA Dataset", type: "Текст", icon: FileText, size: "5.1M пар", quality: 4.2, price: "180 NXS", tags: ["NLP", "QA"], seller: "TextMine" },
  { name: "Video Action Recognition", type: "Мультимодальный", icon: Layers, size: "120K видео", quality: 4.9, price: "1200 NXS", tags: ["Video", "Action"], seller: "MotionAI" },
  { name: "Medical X-Ray Labeled", type: "Изображения", icon: Image, size: "340K снимков", quality: 4.7, price: "800 NXS", tags: ["Medical", "CV"], seller: "HealthData" },
  { name: "Code Completion Pairs", type: "Текст", icon: FileText, size: "8.2M пар", quality: 4.6, price: "450 NXS", tags: ["Code", "NLP"], seller: "CodeBridge" },
];

const categories = ["Все", "Изображения", "Аудио", "Текст", "Мультимодальный"];

export default function DatasetsPage() {
  const [cat, setCat] = useState("Все");
  const [search, setSearch] = useState("");

  const filtered = datasets.filter((d) =>
    (cat === "Все" || d.type === cat) &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Датасеты</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Лоты под эскроу: после оплаты продавец загружает файл — AI Judge вызывает смарт-контракт
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
          + Опубликовать датасет
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск датасетов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cat === c ? "default" : "ghost"}
              className={cat === c ? "bg-primary text-primary-foreground text-xs" : "text-muted-foreground text-xs hover:text-foreground"}
              onClick={() => setCat(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ds) => (
          <div key={ds.name} className="surface p-5 hover-lift cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <ds.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{ds.name}</h3>
                  <p className="text-xs text-muted-foreground">{ds.type} · {ds.size}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="text-sm font-medium text-foreground">{ds.quality}</span>
              </div>
              <span className="text-xs text-muted-foreground">· {ds.seller}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {ds.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px] border-border text-muted-foreground">{t}</Badge>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="font-heading font-bold text-primary">{ds.price}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground h-8">
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
                  <Download className="h-3.5 w-3.5 mr-1" /> Купить
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
