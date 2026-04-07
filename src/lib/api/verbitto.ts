import { apiUrl } from "@/lib/api/env";

export type CreateVerbittoOffchainTaskBody = {
  creatorPublicKey: string;
  title?: string;
  description: string;
  taskCategory?: number | null;
};

/** Строка Verbitto из БД (Neon), camelCase с API. */
export type VerbittoOffchainTaskDto = {
  id: string;
  creatorPublicKey: string;
  title: string | null;
  description: string;
  descriptionHashHex: string;
  taskCategory: number | null;
  chainTaskPublicKey: string | null;
  createdAt: number;
};

export type CreateVerbittoOffchainTaskResponse = VerbittoOffchainTaskDto;

export async function postVerbittoHash(text: string): Promise<{ descriptionHashHex: string }> {
  const res = await fetch(apiUrl("/api/verbitto/hash"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}

export async function createVerbittoOffchainTask(
  body: CreateVerbittoOffchainTaskBody,
): Promise<CreateVerbittoOffchainTaskResponse> {
  const res = await fetch(apiUrl("/api/verbitto/offchain-tasks"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}

export async function listVerbittoOffchainTasks(limit = 100): Promise<VerbittoOffchainTaskDto[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${apiUrl("/api/verbitto/offchain-tasks")}?${params}`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  const data = (await res.json()) as { tasks: VerbittoOffchainTaskDto[] };
  return data.tasks ?? [];
}

export async function patchVerbittoOffchainChainTask(
  offchainId: string,
  chainTaskPublicKey: string,
): Promise<{ ok: boolean; id: string; chain_task_pubkey: string }> {
  const res = await fetch(apiUrl(`/api/verbitto/offchain-tasks/${encodeURIComponent(offchainId)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chainTaskPublicKey }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}
