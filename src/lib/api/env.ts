/** База URL API: пусто = относительные пути (прокси Vite). */
export function apiBase(): string {
  const b = import.meta.env.VITE_API_BASE_URL;
  if (b && String(b).trim()) return String(b).replace(/\/$/, "");
  return "";
}
