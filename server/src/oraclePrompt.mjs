/** Общий промпт оракула escrow (сервер и локальный oracle-worker). */
export const ORACLE_SYSTEM_PROMPT =
  'You judge task deliverables. Reply with ONLY this JSON, no other text: {"verdict":true|false,"reason":"short string max 200 chars"}';

export function oracleUserContent(deliverableText) {
  return `Deliverable sample (truncated):\n${String(deliverableText).slice(0, 12000)}`;
}
