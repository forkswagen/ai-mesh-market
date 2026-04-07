import { apiUrl } from "@/lib/api/env";

const V = "/api/v1/verbitto";

export type CreateVerbittoOffchainTaskBody = {
  creatorPublicKey: string;
  title?: string;
  description: string;
  taskCategory?: number | null;
};

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

export async function postVerbittoHash(text: string): Promise<{ descriptionHashHex: string }> {
  const res = await fetch(apiUrl(`${V}/hash`), {
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
): Promise<VerbittoOffchainTaskDto> {
  const res = await fetch(apiUrl(`${V}/offchain-tasks`), {
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
  const res = await fetch(`${apiUrl(`${V}/offchain-tasks`)}?${params}`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  const data = (await res.json()) as VerbittoOffchainTaskDto[] | { tasks?: VerbittoOffchainTaskDto[] };
  if (Array.isArray(data)) return data;
  return data.tasks ?? [];
}

export async function patchVerbittoOffchainChainTask(
  offchainId: string,
  chainTaskPublicKey: string,
): Promise<{ ok: boolean; id: string; chain_task_pubkey: string; task: VerbittoOffchainTaskDto }> {
  const res = await fetch(apiUrl(`${V}/offchain-tasks/${encodeURIComponent(offchainId)}`), {
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
