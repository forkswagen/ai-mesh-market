const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function getToken(): string | null {
  return localStorage.getItem("sol_toloka_token");
}

export function setToken(token: string) {
  localStorage.setItem("sol_toloka_token", token);
}

export function clearToken() {
  localStorage.removeItem("sol_toloka_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.message || `API error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ───
export const authApi = {
  challenge: (wallet: string) =>
    request<{ challenge: string }>("/auth/challenge", {
      method: "POST",
      body: JSON.stringify({ wallet }),
    }),
  verify: (data: { wallet: string; signature: string; message: string; is_provider: boolean }) =>
    request<{ access_token: string; token_type: string }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Profile ───
export const profileApi = {
  me: () => request<ProfileUser>("/profile/me"),
  stats: () => request<ProfileStats>("/profile/stats"),
};

// ─── Tasks ───
export const tasksApi = {
  list: (status = "open") => request<Task[]>(`/tasks/?status=${status}`),
  create: (data: TaskCreate) =>
    request<Task>("/tasks/", { method: "POST", body: JSON.stringify(data) }),
  submit: (taskId: string, data: { proof_ipfs: string; proof_data: Record<string, unknown> }) =>
    request<void>(`/tasks/${taskId}/submit`, { method: "POST", body: JSON.stringify(data) }),
};

// ─── Compute ───
export const computeApi = {
  nodes: () => request<ComputeNode[]>("/compute/nodes"),
  registerNode: (data: ComputeNodeCreate) =>
    request<ComputeNode>("/compute/nodes", { method: "POST", body: JSON.stringify(data) }),
  rent: (data: { node_id: string; job_config: Record<string, unknown>; hours_requested: number }) =>
    request<ComputeSession>("/compute/rent", { method: "POST", body: JSON.stringify(data) }),
};

// ─── Agents ───
export const agentsApi = {
  list: () => request<Agent[]>("/agents/"),
  create: (data: AgentCreate) =>
    request<Agent>("/agents/", { method: "POST", body: JSON.stringify(data) }),
  invoke: (agentId: string, payload: string) =>
    request<{ result: unknown }>(`/agents/${agentId}/invoke`, {
      method: "POST",
      body: JSON.stringify({ input_payload: payload }),
    }),
};

// ─── Escrow ───
export const escrowApi = {
  list: () => request<EscrowTransaction[]>("/escrow/"),
  verdict: (escrowId: string) => request<JudgeVerdict>(`/judge/${escrowId}/verdict`),
};

// ─── Notifications ───
export const notificationsApi = {
  list: () => request<AppNotification[]>("/notifications/"),
  markRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: "PATCH" }),
};

// ─── Settings ───
export const settingsApi = {
  setPrivacy: (enabled: boolean) =>
    request<void>(`/settings/privacy?enabled=${enabled}`, { method: "PATCH" }),
};

// ─── Types ───
export interface ProfileUser {
  id: string;
  wallet: string;
  reputation: number;
  earned: number;
  is_provider: boolean;
  created_at: string;
}

export interface ProfileStats {
  reputation: number;
  total_earned: number;
  tasks_completed: number;
  tasks_created: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward_per_unit: number;
  total_budget: number;
  task_type: string;
  status: string;
  ai_judge_enabled: boolean;
  slots_total: number;
  slots_filled: number;
  deadline: string;
  created_at: string;
}

export interface TaskCreate {
  title: string;
  description: string;
  reward_per_unit: number;
  total_budget: number;
  task_type: string;
  ai_judge_enabled: boolean;
}

export interface ComputeNode {
  id: string;
  name: string;
  gpu_model: string;
  vram_gb: number;
  price_per_hour: number;
  location: string;
  uptime: number;
  status: string;
}

export interface ComputeNodeCreate {
  gpu_model: string;
  vram_gb: number;
  price_per_hour: number;
  location: string;
}

export interface ComputeSession {
  id: string;
  node_id: string;
  status: string;
  hours_requested: number;
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  owner: string;
  rating: number;
  price: string;
  tasks_completed: number;
  privacy: boolean;
  status: string;
}

export interface AgentCreate {
  name: string;
  model: string;
  price: string;
  privacy: boolean;
}

export interface EscrowTransaction {
  id: string;
  task_title: string;
  amount: number;
  currency: string;
  status: string;
  ai_score: number | null;
  ai_verdict: string | null;
  created_at: string;
}

export interface JudgeVerdict {
  ai_score: number;
  ai_verdict: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  text: string;
  read: boolean;
  created_at: string;
}
