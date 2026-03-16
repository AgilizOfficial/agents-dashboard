export interface Agent {
  id: string;
  name: string;
  emoji?: string;
  workspace?: string;
}

export interface CronJob {
  id: string;
  name?: string;
  schedule: string;
  enabled: boolean;
  nextRunAtMs?: number;
  lastRunAtMs?: number;
  action?: { type: string; session?: string; prompt?: string };
}

export interface AgentUsage {
  agentId: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export interface GeminiQuota {
  models: { name: string; remainingFraction: number }[];
}

async function call<T>(method: string, params: unknown = {}): Promise<T> {
  const res = await fetch("/api/openclaw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result as T;
}

export async function getAgents(): Promise<Agent[]> {
  const result = await call<{ agents: Agent[] }>("agents.list", {});
  return result.agents ?? [];
}

export async function getCrons(opts?: { includeDisabled?: boolean }): Promise<CronJob[]> {
  const result = await call<{ crons: CronJob[] }>("cron.list", {
    includeDisabled: opts?.includeDisabled ?? true,
    limit: 100,
  });
  return result.crons ?? [];
}

export async function runCron(id: string): Promise<void> {
  await call("cron.run", { id, mode: "force" });
}

export async function toggleCron(id: string, enabled: boolean): Promise<void> {
  await call("cron.update", { id, enabled });
}

export async function getUsage(days = 7): Promise<AgentUsage[]> {
  const result = await call<{ sessions: { agentId?: string; totalTokens?: number; inputTokens?: number; outputTokens?: number; totalCost?: number }[] }>(
    "sessions.usage",
    { days }
  );
  const byAgent = new Map<string, AgentUsage>();
  for (const s of result.sessions ?? []) {
    const key = s.agentId ?? "unknown";
    const cur = byAgent.get(key) ?? { agentId: key, totalTokens: 0, inputTokens: 0, outputTokens: 0, totalCost: 0 };
    cur.totalTokens += s.totalTokens ?? 0;
    cur.inputTokens += s.inputTokens ?? 0;
    cur.outputTokens += s.outputTokens ?? 0;
    cur.totalCost += s.totalCost ?? 0;
    byAgent.set(key, cur);
  }
  return Array.from(byAgent.values());
}

export async function getGeminiQuota(): Promise<GeminiQuota> {
  const result = await call<{ providers?: { id: string; models?: { name: string; remainingFraction: number }[] }[] }>(
    "usage.status",
    {}
  );
  const gemini = result.providers?.find((p) => p.id === "google-gemini-cli");
  return { models: gemini?.models ?? [] };
}
