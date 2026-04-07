import { apiUrl } from "@/lib/api/env";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AgentInferResponse = {
  ok: boolean;
  text?: string;
  agentLogicalId?: string;
  sessionId?: string;
  error?: string;
};

export async function postAgentInfer(body: {
  agentId: string;
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<AgentInferResponse> {
  const r = await fetch(apiUrl("/api/agent/infer"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: body.agentId,
      messages: body.messages,
      model: body.model,
      temperature: body.temperature,
    }),
  });
  const data = (await r.json()) as AgentInferResponse;
  if (!r.ok) {
    throw new Error(data.error || r.statusText);
  }
  return data;
}
