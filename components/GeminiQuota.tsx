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
      <div className="rounded-xl border border-yellow-900/30 bg-black p-4">
        <p className="text-xs text-yellow-600">Quota Gemini indisponível ou em carregamento...</p>
      </div>
    );
  }

  const isCritical = quota.models.some(m => m.remainingFraction < 0.1);

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${isCritical ? "border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-green-800 bg-black"}`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${isCritical ? "text-red-400 animate-pulse" : "text-green-400"}`}>
          {isCritical ? "Gemini — Limite de API Proximo" : "Gemini — Quota disponivel"}
        </h2>
        {isCritical && (
          <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Crítico
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quota.models.map((m) => {
          const pct = Math.round(m.remainingFraction * 100);
          const low = pct < 15;
          return (
            <div key={m.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{label(m.name)}</span>
                <span className={`font-medium ${low ? "text-red-400" : pct < 50 ? "text-yellow-400" : "text-green-400"}`}>
                  {pct}% {low ? "Restante" : "OK"}
                </span>
              </div>
              <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${low ? "bg-red-500" : pct < 50 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {isCritical && (
        <p className="text-[11px] text-red-300/80 bg-red-900/20 p-2 rounded-lg border border-red-800/30">
          <strong>Sugestão:</strong> Reduz as tarefas automáticas (Crons) ou limpa as sessões dos agentes para evitar interrupções.
        </p>
      )}
    </div>
  );
}
