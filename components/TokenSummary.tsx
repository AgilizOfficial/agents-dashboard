import type { AgentUsage, GeminiQuota, TotalCost } from "@/lib/openclaw";

export default function TokenSummary({ usages, days, totalCost, quota }: { usages: AgentUsage[]; days: number; totalCost?: TotalCost | null; quota?: GeminiQuota | null }) {
  const periodTokens = usages.reduce((s, u) => s + u.totalTokens, 0);
  const periodCost = usages.reduce((s, u) => s + u.totalCost, 0);
  const periodInput = usages.reduce((s, u) => s + u.inputTokens, 0);
  const periodOutput = usages.reduce((s, u) => s + u.outputTokens, 0);

  // Gemini quota (if available from usage.status)
  const avgRemaining = quota?.models.length
    ? quota.models.reduce((s, m) => s + m.remainingFraction, 0) / quota.models.length
    : null;

  const fmtTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString("pt");
  };

  return (
    <div className="rounded-xl border border-green-900/30 bg-black p-4 flex flex-col gap-4">
      {/* Total acumulado */}
      {totalCost && (
        <div className="pb-4 border-b border-green-900/20">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Total tokens gastos</span>
              <span className="text-3xl font-bold text-green-400">{fmtTokens(totalCost.totalTokens)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Custo total</span>
              <span className="text-3xl font-bold text-green-400">${totalCost.totalCost.toFixed(4)}</span>
            </div>
          </div>

          {/* Gemini quota bar (only if data available) */}
          {avgRemaining !== null && (
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Quota Gemini</span>
                <span className={`font-bold ${avgRemaining < 0.15 ? "text-red-400" : avgRemaining < 0.5 ? "text-yellow-400" : "text-green-400"}`}>
                  {Math.round(avgRemaining * 100)}% restante
                </span>
              </div>
              <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${avgRemaining < 0.15 ? "bg-red-500" : avgRemaining < 0.5 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.round(avgRemaining * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Period breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label={`Tokens (${days}d)`} value={fmtTokens(periodTokens)} />
        <Stat label={`Custo (${days}d)`} value={`$${periodCost.toFixed(4)}`} />
        <Stat label="Input tokens" value={fmtTokens(periodInput)} />
        <Stat label="Output tokens" value={fmtTokens(periodOutput)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-600">{label}</span>
      <span className="text-lg font-semibold text-green-400">{value}</span>
    </div>
  );
}
