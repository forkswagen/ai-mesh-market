/**
 * SolToloka Python backend (FastAPI).
 * Локально: префикс /st → Vite прокси на :8000.
 * Прод: задайте VITE_SOLToloka_API_URL=https://your-soltoloka.railway.app (без слэша в конце).
 */
export function soltolokaApiUrl(path: string): string {
  const configured = import.meta.env.VITE_SOLToloka_API_URL?.trim();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (configured) {
    return `${configured.replace(/\/$/, "")}${normalized}`;
  }
  return `/st${normalized}`;
}
