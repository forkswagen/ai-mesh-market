/**
 * Опциональный SolToloka FastAPI — только страница `/soltoloka`.
 * Основное приложение (escrow, tasks) живёт на Node-оркестраторе (`getBackendOrigin`).
 */
import { DEFAULT_SOLToloka_ORIGIN, getSoltolokaApiOrigin } from "@/lib/api/backendOrigin";

/** @deprecated используйте DEFAULT_SOLToloka_ORIGIN */
export const SOLToloka_DEFAULT_ORIGIN = DEFAULT_SOLToloka_ORIGIN;

export function soltolokaOrigin(): string {
  return getSoltolokaApiOrigin();
}

export function soltolokaApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSoltolokaApiOrigin()}${normalized}`;
}

export function soltolokaDocsUrl(): string {
  return `${getSoltolokaApiOrigin()}/docs`;
}
