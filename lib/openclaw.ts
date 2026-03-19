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

export interface TotalCost {
  totalTokens: number;
  totalCost: number;
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
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const result = await call<{ sessions: { agentId?: string; totalTokens?: number; inputTokens?: number; outputTokens?: number; totalCost?: number }[] }>(
    "sessions.usage",
    { startDate: fmt(start), endDate: fmt(end) }
  );
  // Try aggregates first (more accurate), fallback to sessions
  const aggregates = (result as Record<string, unknown>).aggregates as { byAgent?: { agentId: string; totals: { totalTokens?: number; input?: number; output?: number; totalCost?: number } }[] } | undefined;
  if (aggregates?.byAgent) {
    return aggregates.byAgent.map((a) => ({
      agentId: a.agentId,
      totalTokens: a.totals.totalTokens ?? 0,
      inputTokens: a.totals.input ?? 0,
      outputTokens: a.totals.output ?? 0,
      totalCost: a.totals.totalCost ?? 0,
    }));
  }
  const byAgent = new Map<string, AgentUsage>();
  for (const s of result.sessions ?? []) {
    const key = s.agentId ?? "unknown";
    const u = (s as Record<string, unknown>).usage as { totalTokens?: number; input?: number; output?: number; totalCost?: number } | undefined;
    const cur = byAgent.get(key) ?? { agentId: key, totalTokens: 0, inputTokens: 0, outputTokens: 0, totalCost: 0 };
    cur.totalTokens += u?.totalTokens ?? 0;
    cur.inputTokens += u?.input ?? 0;
    cur.outputTokens += u?.output ?? 0;
    cur.totalCost += u?.totalCost ?? 0;
    byAgent.set(key, cur);
  }
  return Array.from(byAgent.values());
}

export async function getTotalCost(): Promise<TotalCost> {
  const result = await call<{ daily: { totalTokens: number; totalCost: number }[] }>(
    "usage.cost",
    {}
  );
  const days = result.daily ?? [];
  return {
    totalTokens: days.reduce((s, d) => s + (d.totalTokens ?? 0), 0),
    totalCost: days.reduce((s, d) => s + (d.totalCost ?? 0), 0),
  };
}

export async function getGeminiQuota(): Promise<GeminiQuota> {
  const result = await call<{ providers?: { id: string; models?: { name: string; remainingFraction: number }[] }[] }>(
    "usage.status",
    {}
  );
  const gemini = result.providers?.find((p) => p.id === "google-gemini-cli");
  return { models: gemini?.models ?? [] };
}

export async function purgeSessions(agentId?: string): Promise<void> {
  // Chamada teórica para limpar histórico/memória e libertar tokens de contexto
  await call("sessions.purge", { agentId });
}
