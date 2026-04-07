import { apiUrl } from "./env";

export type AgentsChallengeResponse = { message: string; logicalId: string };

export async function postAgentsChallenge(body: { wallet: string; logicalId: string }): Promise<AgentsChallengeResponse> {
  const res = await fetch(apiUrl("/api/v1/agents/challenge"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await res.json().catch(() => ({}))) as AgentsChallengeResponse & { error?: string };
  if (!res.ok) throw new Error(j.error || `challenge: ${res.status}`);
  return { message: j.message, logicalId: j.logicalId };
}

export type RegisteredAgentPublic = {
  id: string;
  walletPubkey: string;
  logicalId: string;
  displayName: string | null;
  createdAt: number;
  updatedAt: number;
};

export type AgentsRegisterResponse = {
  ok: true;
  agent: {
    id: string;
    walletPubkey: string;
    logicalId: string;
    displayName: string | null;
  };
};

export async function postAgentsRegister(body: {
  wallet: string;
  logicalId: string;
  message: string;
  signatureBase64: string;
  displayName?: string;
  webhookUrl?: string;
}): Promise<AgentsRegisterResponse> {
  const res = await fetch(apiUrl("/api/v1/agents/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await res.json().catch(() => ({}))) as AgentsRegisterResponse & { error?: string; ok?: boolean };
  if (!res.ok || !j.ok) throw new Error(j.error || `register: ${res.status}`);
  return j as AgentsRegisterResponse;
}

export async function fetchAgentsRegistry(): Promise<RegisteredAgentPublic[]> {
  const res = await fetch(apiUrl("/api/v1/agents/registry"));
  const j = (await res.json().catch(() => ({}))) as { agents?: RegisteredAgentPublic[]; error?: string };
  if (!res.ok) throw new Error(j.error || `registry: ${res.status}`);
  return j.agents ?? [];
}
