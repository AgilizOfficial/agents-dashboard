import type { GeminiQuota } from "@/lib/openclaw";

const MODEL_LABEL: Record<string, string> = {
  pro:   "Gemini Pro",
  flash: "Gemini Flash",
};

function label(name: string) {
  const key = Object.keys(MODEL_LABEL).find((k) => name.toLowerCase().includes(k));
  return key ? MODEL_LABEL[key] : name;
}

export default function GeminiQuota({ quota }: { quota: GeminiQuota | null }) {
  if (!quota || quota.models.length === 0) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <p className="text-xs text-gray-500">Quota Gemini indisponível</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-900 bg-gray-900 p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-blue-300">Gemini — Quota disponível</h2>
      {quota.models.map((m) => {
        const pct = Math.round(m.remainingFraction * 100);
        return (
          <div key={m.name} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{label(m.name)}</span>
              <span className={pct < 20 ? "text-red-400" : pct < 50 ? "text-yellow-400" : "text-emerald-400"}>
                {pct}% disponível
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct < 20 ? "bg-red-500" : pct < 50 ? "bg-yellow-500" : "bg-emerald-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
