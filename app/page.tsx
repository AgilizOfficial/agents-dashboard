"use client";

import { useCallback, useEffect, useState } from "react";
import type { Agent, AgentUsage, CronJob, GeminiQuota } from "@/lib/openclaw";
import { getAgents, getCrons, getUsage, getGeminiQuota } from "@/lib/openclaw";
import AgentCard from "@/components/AgentCard";
import GeminiQuotaComp from "@/components/GeminiQuota";
import TokenSummary from "@/components/TokenSummary";

const DAYS = 7;
const REFRESH_INTERVAL = 30_000;

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [crons, setCrons] = useState<CronJob[]>([]);
  const [usages, setUsages] = useState<AgentUsage[]>([]);
  const [quota, setQuota] = useState<GeminiQuota | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [a, c, u, q] = await Promise.allSettled([
        getAgents(),
        getCrons({ includeDisabled: true }),
        getUsage(DAYS),
        getGeminiQuota(),
      ]);
      if (a.status === "fulfilled") setAgents(a.value);
      if (c.status === "fulfilled") setCrons(c.value);
      if (u.status === "fulfilled") setUsages(u.value);
      if (q.status === "fulfilled") setQuota(q.value);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  // Associate crons to agents by matching agent name in prompt/session
  function cronsForAgent(agent: Agent): CronJob[] {
    return crons.filter((c) => {
      const text = [c.action?.session, c.action?.prompt, c.name].join(" ").toLowerCase();
      return text.includes(agent.name?.toLowerCase() ?? "___");
    });
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">⚡ Agents Dashboard</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Atualizado: {lastUpdated.toLocaleTimeString("pt")}
            </span>
          )}
          <button
            onClick={refresh}
            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950 text-red-300 px-4 py-3 text-sm">
          ⚠ {error}
        </div>
      )}

      {/* Gemini Quota */}
      <GeminiQuotaComp quota={quota} />

      {/* Token Summary */}
      {usages.length > 0 && <TokenSummary usages={usages} days={DAYS} />}

      {/* Agents grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 h-48 animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum agente encontrado. Verifique a ligação ao OpenClaw.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              crons={cronsForAgent(agent)}
              usage={usages.find((u) => u.agentId === agent.id || u.agentId === agent.name)}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-700 text-center">
        Auto-refresh a cada {REFRESH_INTERVAL / 1000}s · OpenClaw Gateway
      </p>
    </main>
  );
}
