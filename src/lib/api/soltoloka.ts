/**
 * SolToloka FastAPI — тот же хост, что и остальной API (`getBackendOrigin`).
 * Документация: `{origin}/docs`
 */
import { DEFAULT_BACKEND_ORIGIN, getBackendOrigin } from "@/lib/api/backendOrigin";

/** @deprecated используйте DEFAULT_BACKEND_ORIGIN */
export const SOLToloka_DEFAULT_ORIGIN = DEFAULT_BACKEND_ORIGIN;

export function soltolokaOrigin(): string {
  return getBackendOrigin();
}

export function soltolokaApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendOrigin()}${normalized}`;
}

export function soltolokaDocsUrl(): string {
  return `${getBackendOrigin()}/docs`;
}
