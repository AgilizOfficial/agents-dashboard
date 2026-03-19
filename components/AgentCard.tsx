"use client";

import { useState } from "react";
import type { Agent, AgentUsage, CronJob } from "@/lib/openclaw";
import { runCron, toggleCron } from "@/lib/openclaw";

const AGENT_META: Record<string, { initials: string; role: string; image?: string }> = {
  shrams:  { initials: "SH", role: "Tech Lead" },
  iris:    { initials: "IR", role: "COO" },
  atlas:   { initials: "AT", role: "Personal Trainer" },
  marcus:  { initials: "MR", role: "Marketing & Growth" },
  scout:   { initials: "SC", role: "Trend Analyst" },
  pieter:  { initials: "PT", role: "X/Twitter Strategy" },
  phc:     { initials: "PH", role: "ERP Specialist", image: "/phc.jpeg" },
  karpitz: { initials: "KP", role: "Research & Innovation" },
};

interface Props {
  agent: Agent;
  crons: CronJob[];
  usage?: AgentUsage;
  onRefresh: () => void;
}

export default function AgentCard({ agent, crons, usage, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const meta = AGENT_META[agent.name?.toLowerCase() ?? ""] ?? AGENT_META[agent.id?.toLowerCase() ?? ""] ?? { initials: "AG", role: "Agente" };
  const tokens = usage?.totalTokens ?? 0;
  const cost = usage?.totalCost ?? 0;
  const isActive = tokens > 0;

  async function handleRun(cronId: string) {
    setLoading("run-" + cronId);
    try { await runCron(cronId); } finally { setLoading(null); onRefresh(); }
  }

  async function handleToggleCron(cronId: string, enabled: boolean) {
    setLoading("toggle-" + cronId);
    try { await toggleCron(cronId, !enabled); } finally { setLoading(null); onRefresh(); }
  }

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${isActive ? "border-green-700/50 bg-black" : "border-red-900/30 bg-black"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {meta.image ? (
            <img src={meta.image} alt={agent.name} className="w-8 h-8 rounded-md object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-md bg-green-900/40 border border-green-800/50 flex items-center justify-center text-xs font-bold text-green-400">{meta.initials}</span>
          )}
          <div>
            <div className="font-semibold text-sm capitalize text-white">{agent.name}</div>
            <div className="text-xs text-gray-500">{meta.role}</div>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${isActive ? "bg-green-900/50 text-green-400 border border-green-800/50" : "bg-red-900/30 text-red-400 border border-red-800/40"}`}>
          {isActive ? "● ativo" : "○ inativo"}
        </span>
      </div>

      {/* Token usage */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span>{tokens.toLocaleString("pt")} tokens</span>
        <span>${cost.toFixed(4)}</span>
      </div>

      {/* Cron jobs */}
      <div className="flex flex-col gap-1.5">
        {crons.length === 0 && <p className="text-xs text-gray-700">Sem crons configurados</p>}
        {crons.map((cron) => (
          <div key={cron.id} className="flex items-center justify-between gap-2 text-xs bg-black/50 border border-green-900/20 rounded-lg px-2 py-1.5">
            <span className="text-gray-400 truncate max-w-[120px]" title={cron.action?.prompt ?? cron.name ?? cron.id}>
              {cron.action?.prompt?.slice(0, 30) ?? cron.name ?? cron.schedule}
            </span>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleToggleCron(cron.id, cron.enabled)}
                disabled={loading === "toggle-" + cron.id}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${cron.enabled ? "bg-green-900/40 text-green-400 hover:bg-green-800/50" : "bg-gray-900 text-gray-500 hover:bg-gray-800"}`}
              >
                {loading === "toggle-" + cron.id ? "..." : cron.enabled ? "⏸" : "▶"}
              </button>
              <button
                onClick={() => handleRun(cron.id)}
                disabled={loading === "run-" + cron.id}
                className="px-2 py-0.5 rounded text-xs bg-green-900/40 text-green-400 hover:bg-green-800/50 border border-green-800/50 font-medium transition"
              >
                {loading === "run-" + cron.id ? "..." : "▶ Run"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-2 border-t border-white/5 flex gap-2">
        <button
          onClick={async () => {
            setLoading("purge");
            try {
              const { purgeSessions } = await import("@/lib/openclaw");
              await purgeSessions(agent.id);
            } finally {
              setLoading(null);
              onRefresh();
            }
          }}
          disabled={loading === "purge"}
          className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-gray-900 text-gray-400 hover:bg-red-950/30 hover:text-red-400 border border-white/5 transition"
          title="Limpa o histórico da sessão para poupar tokens de contexto"
        >
          {loading === "purge" ? "A limpar..." : "Limpar Sessao"}
        </button>
      </div>
    </div>
  );
}
