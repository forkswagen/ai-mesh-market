/**
 * Поиск датасетов идёт напрямую из браузера:
 * - Hugging Face отражает Origin в Access-Control-Allow-Origin.
 * - Kaggle отдаёт Access-Control-Allow-Origin: *.
 * Оркестратор для этого не обязателен.
 */
const HF_DATASETS_API = "https://huggingface.co/api/datasets";
const KAGGLE_DATASETS_LIST = "https://www.kaggle.com/api/v1/datasets/list";

function parseJsonBody<T>(text: string, label: string): T {
  const t = text.trim();
  if (t.startsWith("<") || t.startsWith("<!DOCTYPE")) {
    throw new Error(
      `${label}: вместо JSON пришла HTML-страница (ограничение сети или антибот). Попробуйте позже или другой запрос.`,
    );
  }
  try {
    return JSON.parse(t) as T;
  } catch {
    throw new Error(`${label}: не JSON — ${t.slice(0, 160)}`);
  }
}

function clampLimit(n: number, min: number, max: number, fallback: number): number {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return fallback;
  return Math.min(max, Math.max(min, x));
}

export type HubDatasetItem = {
  source: "huggingface" | "kaggle";
  id: string;
  title: string;
  description?: string;
  url: string;
  downloads?: number;
  likes?: number;
  tags?: string[];
  lastModified?: string;
  sizeBytes?: number;
  lastUpdated?: string;
};

function mapHuggingFaceRow(raw: Record<string, unknown>): HubDatasetItem {
  const id = typeof raw.id === "string" ? raw.id : "";
  const desc = typeof raw.description === "string" ? raw.description : "";
  const tags = Array.isArray(raw.tags) ? raw.tags.map((x) => String(x)).slice(0, 12) : [];
  const downloads = typeof raw.downloads === "number" ? raw.downloads : undefined;
  const likes = typeof raw.likes === "number" ? raw.likes : undefined;
  return {
    source: "huggingface",
    id,
    title: id || "unknown",
    description: desc.replace(/\s+/g, " ").trim().slice(0, 500),
    url: id ? `https://huggingface.co/datasets/${id}` : "https://huggingface.co/datasets",
    downloads,
    likes,
    tags,
    lastModified: typeof raw.lastModified === "string" ? raw.lastModified : undefined,
  };
}

function mapKaggleRow(raw: Record<string, unknown>): HubDatasetItem {
  const ref = typeof raw.ref === "string" ? raw.ref : "";
  const title =
    (typeof raw.titleNullable === "string" && raw.titleNullable) ||
    (typeof raw.title === "string" && raw.title) ||
    ref ||
    "dataset";
  const bytes = typeof raw.totalBytes === "number" ? raw.totalBytes : undefined;
  const desc =
    (typeof raw.subtitleNullable === "string" && raw.subtitleNullable) ||
    (typeof raw.subtitle === "string" && raw.subtitle) ||
    "";
  const urlStr =
    (typeof raw.urlNullable === "string" && raw.urlNullable) ||
    (typeof raw.url === "string" && raw.url) ||
    (ref ? `https://www.kaggle.com/datasets/${ref}` : "https://www.kaggle.com/datasets");
  const downloads = typeof raw.downloadCount === "number" ? raw.downloadCount : undefined;
  return {
    source: "kaggle",
    id: ref,
    title,
    description: String(desc).replace(/\s+/g, " ").trim().slice(0, 500),
    url: urlStr,
    downloads,
    sizeBytes: bytes,
    lastUpdated: typeof raw.lastUpdated === "string" ? raw.lastUpdated : undefined,
  };
}

export async function fetchHuggingFaceHub(q: string, limit = 24): Promise<HubDatasetItem[]> {
  const lim = clampLimit(limit, 1, 50, 24);
  const url = new URL(HF_DATASETS_API);
  if (q.trim()) url.searchParams.set("search", q.trim());
  url.searchParams.set("limit", String(lim));

  const res = await fetch(url.href, { headers: { Accept: "application/json" } });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Hugging Face: HTTP ${res.status} — ${raw.slice(0, 200)}`);
  }
  const data = parseJsonBody<unknown>(raw, "Hugging Face");
  if (!Array.isArray(data)) {
    throw new Error("Hugging Face: неожиданный формат ответа");
  }
  return data
    .slice(0, lim)
    .map((row) => mapHuggingFaceRow(row as Record<string, unknown>));
}

export async function fetchKaggleHub(q: string, pageSize = 20): Promise<HubDatasetItem[]> {
  const ps = clampLimit(pageSize, 1, 40, 20);
  const url = new URL(KAGGLE_DATASETS_LIST);
  if (q.trim()) url.searchParams.set("search", q.trim());
  url.searchParams.set("page", "1");
  url.searchParams.set("pageSize", String(ps));

  const res = await fetch(url.href, { headers: { Accept: "application/json" } });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Kaggle: HTTP ${res.status} — ${raw.slice(0, 200)}`);
  }
  const data = parseJsonBody<unknown>(raw, "Kaggle");
  if (!Array.isArray(data)) {
    throw new Error("Kaggle: неожиданный формат ответа");
  }
  return data.slice(0, ps).map((row) => mapKaggleRow(row as Record<string, unknown>));
}
