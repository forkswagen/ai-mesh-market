import { motion } from "framer-motion";
import { FileText, Image, Mic, Layers, Star, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const datasets = [
  {
    name: "ImageNet-XL Annotations",
    type: "Изображения",
    icon: Image,
    size: "2.3M записей",
    quality: 4.8,
    price: "500 NXS",
    tags: ["CV", "Classification"],
  },
  {
    name: "Multilingual TTS Corpus",
    type: "Аудио",
    icon: Mic,
    size: "890K сэмплов",
    quality: 4.5,
    price: "320 NXS",
    tags: ["TTS", "Multilingual"],
  },
  {
    name: "Reddit QA Dataset",
    type: "Текст",
    icon: FileText,
    size: "5.1M пар",
    quality: 4.2,
    price: "180 NXS",
    tags: ["NLP", "QA"],
  },
  {
    name: "Video Action Recognition",
    type: "Мультимодальный",
    icon: Layers,
    size: "120K видео",
    quality: 4.9,
    price: "1200 NXS",
    tags: ["Video", "Action"],
  },
];

export default function DatasetsSection() {
  return (
    <section id="datasets" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Маркетплейс <span className="text-gradient">датасетов</span>
          </h2>
          <p className="text-muted-foreground text-lg">AI-проверка качества, покупка одним кликом</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {datasets.map((ds, i) => (
            <motion.div
              key={ds.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-6 hover-glow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-muted">
                    <ds.icon size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{ds.name}</h3>
                    <p className="text-xs text-muted-foreground">{ds.type} · {ds.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} className="text-primary fill-primary" />
                  <span className="text-foreground font-medium">{ds.quality}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {ds.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs border-border text-muted-foreground">{t}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-lg text-primary">{ds.price}</span>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
                  <Download size={14} /> Купить
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
