import { orchestratorApiUrl } from "@/lib/api/backendOrigin";

export type PlatformTaskDto = {
  id: string;
  title: string;
  description: string;
  category: number;
  status: string;
  createdBy: string | null;
  createdAt: number;
};

export type CreatePlatformTaskBody = {
  title: string;
  description: string;
  category: number;
  createdBy?: string | null;
  status?: string;
};

export async function listPlatformTasks(limit = 100): Promise<PlatformTaskDto[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${orchestratorApiUrl("/api/tasks")}?${params}`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  const data = (await res.json()) as { tasks: PlatformTaskDto[] };
  return data.tasks ?? [];
}

export async function createPlatformTask(body: CreatePlatformTaskBody): Promise<PlatformTaskDto> {
  const res = await fetch(orchestratorApiUrl("/api/tasks"), {
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

export async function patchPlatformTaskStatus(
  id: string,
  status: "open" | "in_progress" | "done",
): Promise<{ ok: boolean; task: PlatformTaskDto | null }> {
  const res = await fetch(orchestratorApiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}
