import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tasksApi, computeApi, agentsApi, escrowApi,
  notificationsApi, profileApi, settingsApi,
  type TaskCreate, type ComputeNodeCreate, type AgentCreate,
} from "@/lib/api";

// ─── Profile ───
export function useProfileStats() {
  return useQuery({ queryKey: ["profile", "stats"], queryFn: profileApi.stats });
}

// ─── Tasks ───
export function useTasks(status = "open") {
  return useQuery({ queryKey: ["tasks", status], queryFn: () => tasksApi.list(status) });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string; proof_ipfs: string; proof_data: Record<string, unknown> }) =>
      tasksApi.submit(taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

// ─── Compute ───
export function useComputeNodes() {
  return useQuery({ queryKey: ["compute", "nodes"], queryFn: computeApi.nodes });
}

export function useRegisterNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ComputeNodeCreate) => computeApi.registerNode(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compute"] }),
  });
}

export function useRentNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { node_id: string; job_config: Record<string, unknown>; hours_requested: number }) =>
      computeApi.rent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compute"] }),
  });
}

// ─── Agents ───
export function useAgents() {
  return useQuery({ queryKey: ["agents"], queryFn: agentsApi.list });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AgentCreate) => agentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}

export function useInvokeAgent() {
  return useMutation({
    mutationFn: ({ agentId, payload }: { agentId: string; payload: string }) =>
      agentsApi.invoke(agentId, payload),
  });
}

// ─── Escrow ───
export function useEscrowTransactions() {
  return useQuery({ queryKey: ["escrow"], queryFn: escrowApi.list });
}

// ─── Notifications ───
export function useNotifications() {
  return useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list, refetchInterval: 30000 });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ─── Settings ───
export function useSetPrivacy() {
  return useMutation({
    mutationFn: (enabled: boolean) => settingsApi.setPrivacy(enabled),
  });
}
