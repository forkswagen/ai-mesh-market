/**
 * Прокси к публичным каталогам датасетов (Hugging Face Hub, Kaggle list API).
 */

const HF_BASE = "https://huggingface.co/api/datasets";
const KAGGLE_LIST = "https://www.kaggle.com/api/v1/datasets/list";

function clampInt(n, min, max, fallback) {
  const x = Number.parseInt(String(n), 10);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(max, Math.max(min, x));
}

const HUB_HEADERS = {
  Accept: "application/json",
  /** Без UA часть CDN отдаёт HTML-страницу вместо JSON. */
  "User-Agent": "Mozilla/5.0 (compatible; NexusAI-Orchestrator/1.0; +https://github.com/)",
};

/**
 * @param {Response} res
 * @param {string} label
 */
async function readJsonArrayResponse(res, label) {
  const text = await res.text();
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const head = text.trimStart().slice(0, 1);
  if (ct.includes("text/html") || head === "<") {
    throw new Error(
      `${label} вернул HTML вместо JSON (блокировка, капча или неверный URL). Начало ответа: ${text.slice(0, 100)}`,
    );
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label}: не JSON — ${text.slice(0, 160)}`);
  }
  return data;
}

/**
 * @param {{ search?: string; limit?: number }} opts
 */
export async function fetchHuggingFaceDatasets(opts = {}) {
  const search = typeof opts.search === "string" ? opts.search.trim() : "";
  const limit = clampInt(opts.limit ?? 24, 1, 50, 24);
  const url = new URL(HF_BASE);
  if (search) url.searchParams.set("search", search);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.href, { headers: HUB_HEADERS });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Hugging Face API ${res.status}: ${t.slice(0, 200)}`);
  }
  /** @type {unknown} */
  const data = await readJsonArrayResponse(res, "Hugging Face");
  if (!Array.isArray(data)) {
    throw new Error("Hugging Face: unexpected response shape");
  }

  return data.slice(0, limit).map((raw) => {
    const d = /** @type {Record<string, unknown>} */ (raw);
    const id = typeof d.id === "string" ? d.id : "";
    const desc = typeof d.description === "string" ? d.description : "";
    const tags = Array.isArray(d.tags) ? d.tags.map((t) => String(t)).slice(0, 12) : [];
    const downloads = typeof d.downloads === "number" ? d.downloads : undefined;
    const likes = typeof d.likes === "number" ? d.likes : undefined;
    return {
      source: "huggingface",
      id,
      title: id || "unknown",
      description: desc.replace(/\s+/g, " ").trim().slice(0, 500),
      url: id ? `https://huggingface.co/datasets/${id}` : "https://huggingface.co/datasets",
      downloads,
      likes,
      tags,
      lastModified: typeof d.lastModified === "string" ? d.lastModified : undefined,
    };
  });
}

/**
 * @param {{ search?: string; page?: number; pageSize?: number }} opts
 */
export async function fetchKaggleDatasets(opts = {}) {
  const search = typeof opts.search === "string" ? opts.search.trim() : "";
  const page = clampInt(opts.page ?? 1, 1, 200, 1);
  const pageSize = clampInt(opts.pageSize ?? 20, 1, 40, 20);

  const url = new URL(KAGGLE_LIST);
  if (search) url.searchParams.set("search", search);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  const headers = { ...HUB_HEADERS };
  const user = process.env.KAGGLE_USERNAME?.trim();
  const key = process.env.KAGGLE_KEY?.trim();
  if (user && key) {
    const token = Buffer.from(`${user}:${key}`, "utf8").toString("base64");
    headers.Authorization = `Basic ${token}`;
  }

  const res = await fetch(url.href, { headers });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Kaggle API ${res.status}: ${t.slice(0, 200)}`);
  }
  /** @type {unknown} */
  const data = await readJsonArrayResponse(res, "Kaggle");
  if (!Array.isArray(data)) {
    throw new Error("Kaggle: unexpected response shape");
  }

  return data.slice(0, pageSize).map((raw) => {
    const d = /** @type {Record<string, unknown>} */ (raw);
    const ref = typeof d.ref === "string" ? d.ref : "";
    const title =
      (typeof d.titleNullable === "string" && d.titleNullable) ||
      (typeof d.title === "string" && d.title) ||
      ref ||
      "dataset";
    const bytes = typeof d.totalBytes === "number" ? d.totalBytes : undefined;
    const desc =
      (typeof d.subtitleNullable === "string" && d.subtitleNullable) ||
      (typeof d.subtitle === "string" && d.subtitle) ||
      "";
    const urlStr =
      (typeof d.urlNullable === "string" && d.urlNullable) ||
      (typeof d.url === "string" && d.url) ||
      (ref ? `https://www.kaggle.com/datasets/${ref}` : "https://www.kaggle.com/datasets");
    const downloads = typeof d.downloadCount === "number" ? d.downloadCount : undefined;
    return {
      source: "kaggle",
      id: ref,
      title,
      description: String(desc).replace(/\s+/g, " ").trim().slice(0, 500),
      url: urlStr,
      downloads,
      sizeBytes: bytes,
      lastUpdated: typeof d.lastUpdated === "string" ? d.lastUpdated : undefined,
    };
  });
}
