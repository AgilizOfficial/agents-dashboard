"use client";

import { useCallback, useEffect, useState } from "react";
import type { Agent, AgentUsage, CronJob, GeminiQuota, TotalCost } from "@/lib/openclaw";
import { getAgents, getCrons, getUsage, getGeminiQuota, getTotalCost } from "@/lib/openclaw";
import AgentCard from "@/components/AgentCard";
import GeminiQuotaComp from "@/components/GeminiQuota";
import TokenSummary from "@/components/TokenSummary";
import { useWorkspace, type WorkspaceId } from "@/lib/workspace-context";

const AVGROUP_AGENTS = ["phc"];

function agentBelongsToWs(agent: Agent, ws: WorkspaceId): boolean {
  const id = agent.id?.toLowerCase() ?? "";
  if (ws === "avgroup") return AVGROUP_AGENTS.includes(id);
  if (ws === "ggv") return !AVGROUP_AGENTS.includes(id);
  return false;
}

const DAYS = 7;
const REFRESH_INTERVAL = 30_000;

export default function DashboardPage() {
  const { activeWs } = useWorkspace();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [crons, setCrons] = useState<CronJob[]>([]);
  const [usages, setUsages] = useState<AgentUsage[]>([]);
  const [quota, setQuota] = useState<GeminiQuota | null>(null);
  const [totalCost, setTotalCost] = useState<TotalCost | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [a, c, u, q, t] = await Promise.allSettled([
        getAgents(),
        getCrons({ includeDisabled: true }),
        getUsage(DAYS),
        getGeminiQuota(),
        getTotalCost(),
      ]);
      if (a.status === "fulfilled") setAgents(a.value);
      if (c.status === "fulfilled") setCrons(c.value);
      if (u.status === "fulfilled") setUsages(u.value);
      if (q.status === "fulfilled") setQuota(q.value);
      if (t.status === "fulfilled") setTotalCost(t.value);
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

  function cronsForAgent(agent: Agent): CronJob[] {
    return crons.filter((c) => {
      const text = [c.action?.session, c.action?.prompt, c.name].join(" ").toLowerCase();
      return text.includes(agent.name?.toLowerCase() ?? "___");
    });
  }

  const isOutOfQuota = quota?.models.some(m => m.remainingFraction <= 0.01);
  const filteredAgents = agents.filter((a) => agentBelongsToWs(a, activeWs));
  const filteredUsages = usages.filter((u) => filteredAgents.some((a) => a.id === u.agentId || a.name === u.agentId));
  const showAgents = activeWs === "ggv" || activeWs === "avgroup";

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-4 md:gap-6">
      {/* Global Alert */}
      {isOutOfQuota && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">!</span>
            <div>
              <p className="font-bold text-sm">Limite de API Atingido!</p>
              <p className="text-[11px] opacity-90">Os teus agentes nao conseguirao responder ate que a quota do Gemini seja renovada.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-white tracking-tight">Agents Hub</h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              Atualizado: {lastUpdated.toLocaleTimeString("pt")}
            </span>
          )}
          <button
            onClick={refresh}
            className="text-xs px-3 py-1.5 bg-green-900/40 hover:bg-green-800/50 text-green-400 border border-green-800 rounded-lg transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Gemini Quota */}
      <GeminiQuotaComp quota={quota} />

      {/* Token Summary */}
      {filteredUsages.length > 0 && <TokenSummary usages={filteredUsages} days={DAYS} totalCost={totalCost} quota={quota} />}

      {/* Agents grid */}
      {!showAgents ? (
        <div className="rounded-xl border border-green-900/30 bg-black p-8 text-center">
          <p className="text-gray-500 text-sm">Este workspace nao tem agentes OpenClaw associados.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-green-900/30 bg-black h-48 animate-pulse" />
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum agente encontrado. Verifique a ligacao ao OpenClaw.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...filteredAgents]
            .sort((a, b) => {
              const ua = usages.find((u) => u.agentId === a.id || u.agentId === a.name)?.totalTokens ?? 0;
              const ub = usages.find((u) => u.agentId === b.id || u.agentId === b.name)?.totalTokens ?? 0;
              return ub - ua;
            })
            .map((agent) => (
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
        Auto-refresh a cada {REFRESH_INTERVAL / 1000}s
      </p>
    </div>
  );
}
