import type { AgentUsage } from "@/lib/openclaw";

export default function TokenSummary({ usages, days }: { usages: AgentUsage[]; days: number }) {
  const totalTokens = usages.reduce((s, u) => s + u.totalTokens, 0);
  const totalCost = usages.reduce((s, u) => s + u.totalCost, 0);
  const totalInput = usages.reduce((s, u) => s + u.inputTokens, 0);
  const totalOutput = usages.reduce((s, u) => s + u.outputTokens, 0);

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Stat label={`Tokens (${days}d)`} value={totalTokens.toLocaleString("pt")} />
      <Stat label="Custo estimado" value={`$${totalCost.toFixed(4)}`} />
      <Stat label="Input tokens" value={totalInput.toLocaleString("pt")} />
      <Stat label="Output tokens" value={totalOutput.toLocaleString("pt")} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}
