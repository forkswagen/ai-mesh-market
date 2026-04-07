import { useEffect, useMemo, useState, type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, Download, ExternalLink, FileText, Image, Layers, Mic, Search, Star, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchHuggingFaceHub, fetchKaggleHub, type HubDatasetItem } from "@/lib/api/datasetsHub";

const demoDatasets = [
  { name: "ImageNet-XL Annotations", type: "Images", icon: Image, size: "2.3M records", quality: 4.8, price: "500 NXS", tags: ["CV", "Classification"], seller: "DataLab" },
  { name: "Multilingual TTS Corpus", type: "Audio", icon: Mic, size: "890K samples", quality: 4.5, price: "320 NXS", tags: ["TTS", "Multilingual"], seller: "VoiceForge" },
  { name: "Reddit QA Dataset", type: "Text", icon: FileText, size: "5.1M pairs", quality: 4.2, price: "180 NXS", tags: ["NLP", "QA"], seller: "TextMine" },
  { name: "Video Action Recognition", type: "Multimodal", icon: Layers, size: "120K videos", quality: 4.9, price: "1200 NXS", tags: ["Video", "Action"], seller: "MotionAI" },
  { name: "Medical X-Ray Labeled", type: "Images", icon: Image, size: "340K scans", quality: 4.7, price: "800 NXS", tags: ["Medical", "CV"], seller: "HealthData" },
  { name: "Code Completion Pairs", type: "Text", icon: FileText, size: "8.2M pairs", quality: 4.6, price: "450 NXS", tags: ["Code", "NLP"], seller: "CodeBridge" },
];

const categories = ["All", "Images", "Audio", "Text", "Multimodal"];
const typeIcon: Record<string, ElementType> = { Images: Image, Audio: Mic, Text: FileText, Multimodal: Layers };

type SourceTab = "demo" | "huggingface" | "kaggle";

function formatBytes(n?: number): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function hubSubtitle(item: HubDatasetItem): string {
  const parts: string[] = item.source === "huggingface" ? ["Hugging Face"] : ["Kaggle"];
  const dl = item.downloads != null ? `${item.downloads.toLocaleString()} downloads` : null;
  if (dl) parts.push(dl);
  const sz = formatBytes(item.sizeBytes);
  if (sz) parts.push(sz);
  if (item.likes != null) parts.push(`${item.likes} likes`);
  return parts.join(" · ");
}

export default function DatasetsPage() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedHubSearch, setDebouncedHubSearch] = useState("");
  const [source, setSource] = useState<SourceTab>("demo");

  useEffect(() => {
    if (source === "demo") return;
    setDebouncedHubSearch(search);
  }, [source]);

  useEffect(() => {
    if (source === "demo") return;
    const t = window.setTimeout(() => setDebouncedHubSearch(search), 420);
    return () => window.clearTimeout(t);
  }, [search, source]);

  const hubQuery = useQuery({
    queryKey: ["datasetsHub", source, debouncedHubSearch],
    enabled: source === "huggingface" || source === "kaggle",
    queryFn: async () => {
      if (source === "huggingface") return fetchHuggingFaceHub(debouncedHubSearch, 28);
      return fetchKaggleHub(debouncedHubSearch, 24);
    },
    staleTime: 60_000,
  });

  const filteredDemo = useMemo(
    () =>
      demoDatasets.filter(
        (d) => (cat === "All" || d.type === cat) && d.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [cat, search],
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dataset marketplace · Escora</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Demo catalog; HF / Kaggle tabs call{" "}
            <span className="text-foreground/90">public</span> APIs (
            <a className="text-primary hover:underline" href="https://huggingface.co/datasets" target="_blank" rel="noreferrer">
              Hugging Face
            </a>
            ,{" "}
            <a className="text-primary hover:underline" href="https://www.kaggle.com/datasets" target="_blank" rel="noreferrer">
              Kaggle
            </a>
            ) — no backend required
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm w-fit">+ Publish dataset</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["demo", "Escora demo"],
            ["huggingface", "Hugging Face"],
            ["kaggle", "Kaggle"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={source === key ? "default" : "outline"}
            className={
              source === key
                ? "bg-primary text-primary-foreground text-xs"
                : "text-muted-foreground text-xs border-border"
            }
            onClick={() => setSource(key)}
          >
            {key === "huggingface" && <Database className="h-3.5 w-3.5 mr-1.5" />}
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={source === "demo" ? "Search datasets…" : "Search catalog (API query)…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border text-sm"
          />
        </div>
        {source === "demo" && (
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={cat === c ? "default" : "ghost"}
                className={
                  cat === c ? "bg-primary text-primary-foreground text-xs" : "text-muted-foreground text-xs hover:text-foreground"
                }
                onClick={() => setCat(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        )}
      </div>

      {source !== "demo" && (
        <p className="text-xs text-muted-foreground">
          {hubQuery.isFetching ? "Loading…" : hubQuery.isError ? String(hubQuery.error) : null}
          {!hubQuery.isFetching && !hubQuery.isError && hubQuery.data != null
            ? `Found: ${hubQuery.data.length} (source: ${source})`
            : null}
        </p>
      )}

      {source === "demo" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDemo.map((ds) => (
            <div key={ds.name} className="surface p-5 hover-lift cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <ds.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                      {ds.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {ds.type} · {ds.size}
                    </p>
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
                  <Badge key={t} variant="outline" className="text-[10px] border-border text-muted-foreground">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="font-heading font-bold text-primary">{ds.price}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground h-8">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
                    <Download className="h-3.5 w-3.5 mr-1" /> Buy
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {source !== "demo" && !hubQuery.isFetching && hubQuery.data?.length === 0 && !hubQuery.isError && (
        <p className="text-sm text-muted-foreground">Nothing found for this query — try different text.</p>
      )}

      {source !== "demo" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {hubQuery.data?.map((item) => {
            const Icon = typeIcon.Text;
            return (
              <div key={`${item.source}-${item.id}`} className="surface p-5 hover-lift group">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{item.id}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{hubSubtitle(item)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0 border-border">
                    {item.source === "huggingface" ? "HF" : "Kaggle"}
                  </Badge>
                </div>
                {item.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-4 mb-3">{item.description}</p>
                ) : null}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.tags.slice(0, 6).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px] border-border text-muted-foreground max-w-[140px] truncate">
                        {t.replace(/^[^:]+:/, "").slice(0, 24)}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-end pt-3 border-t border-border gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Open
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
