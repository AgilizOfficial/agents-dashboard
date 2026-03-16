"use client";

import { useState } from "react";
import type { Agent, AgentUsage, CronJob } from "@/lib/openclaw";
import { runCron, toggleCron } from "@/lib/openclaw";

const AGENT_META: Record<string, { emoji: string; role: string }> = {
  shrams:  { emoji: "⚙️",  role: "Tech Lead" },
  iris:    { emoji: "🧭",  role: "COO" },
  atlas:   { emoji: "🏋️", role: "Personal Trainer" },
  marcus:  { emoji: "📣",  role: "Marketing & Growth" },
  scout:   { emoji: "🔭",  role: "Trend Analyst" },
  pieter:  { emoji: "🐦",  role: "X/Twitter Strategy" },
  phc:     { emoji: "🗂️", role: "ERP Specialist" },
  karpitz: { emoji: "🔬",  role: "Research & Innovation" },
};

interface Props {
  agent: Agent;
  crons: CronJob[];
  usage?: AgentUsage;
  onRefresh: () => void;
}

export default function AgentCard({ agent, crons, usage, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const meta = AGENT_META[agent.name?.toLowerCase() ?? ""] ?? { emoji: "🤖", role: "Agente" };
  const hasActiveCron = crons.some((c) => c.enabled);
  const isActive = hasActiveCron;

  async function handleRun(cronId: string) {
    setLoading("run-" + cronId);
    try { await runCron(cronId); } finally { setLoading(null); onRefresh(); }
  }

  async function handleToggleCron(cronId: string, enabled: boolean) {
    setLoading("toggle-" + cronId);
    try { await toggleCron(cronId, !enabled); } finally { setLoading(null); onRefresh(); }
  }

  const tokens = usage?.totalTokens ?? 0;
  const cost = usage?.totalCost ?? 0;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${isActive ? "border-emerald-700 bg-gray-900" : "border-gray-700 bg-gray-900/60"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.emoji}</span>
          <div>
            <div className="font-semibold text-sm capitalize text-white">{agent.name}</div>
            <div className="text-xs text-gray-400">{meta.role}</div>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-emerald-900 text-emerald-300" : "bg-gray-800 text-gray-500"}`}>
          {isActive ? "● ativo" : "○ inativo"}
        </span>
      </div>

      {/* Token usage */}
      <div className="flex gap-3 text-xs text-gray-400">
        <span>🔢 {tokens.toLocaleString("pt")} tokens</span>
        <span>💰 ${cost.toFixed(4)}</span>
      </div>

      {/* Cron jobs */}
      <div className="flex flex-col gap-1.5">
        {crons.length === 0 && <p className="text-xs text-gray-600">Sem crons configurados</p>}
        {crons.map((cron) => (
          <div key={cron.id} className="flex items-center justify-between gap-2 text-xs bg-gray-800 rounded-lg px-2 py-1.5">
            <span className="text-gray-300 truncate max-w-[120px]" title={cron.action?.prompt ?? cron.name ?? cron.id}>
              {cron.action?.prompt?.slice(0, 30) ?? cron.name ?? cron.schedule}
            </span>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleToggleCron(cron.id, cron.enabled)}
                disabled={loading === "toggle-" + cron.id}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${cron.enabled ? "bg-yellow-900 text-yellow-300 hover:bg-yellow-800" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}
              >
                {loading === "toggle-" + cron.id ? "..." : cron.enabled ? "⏸" : "▶"}
              </button>
              <button
                onClick={() => handleRun(cron.id)}
                disabled={loading === "run-" + cron.id}
                className="px-2 py-0.5 rounded text-xs bg-blue-900 text-blue-300 hover:bg-blue-800 font-medium transition"
              >
                {loading === "run-" + cron.id ? "..." : "▶ Run"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
