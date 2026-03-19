"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { supabase } from "@/lib/supabase";

interface Player {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  value?: string;
  source?: string;
  stage: Stage;
  assignee?: Player;
  assignee_id?: string | null;
}

type Stage = "new" | "contacted" | "qualified" | "won" | "lost";

const STAGES: { id: Stage; label: string; headerBg: string }[] = [
  { id: "new", label: "New", headerBg: "border-t-gray-500" },
  { id: "contacted", label: "Contacted", headerBg: "border-t-blue-500" },
  { id: "qualified", label: "Qualified", headerBg: "border-t-yellow-500" },
  { id: "won", label: "Won", headerBg: "border-t-green-500" },
  { id: "lost", label: "Lost", headerBg: "border-t-red-500" },
];

function LeadCard({
  lead,
  stage,
  players,
  onMove,
  onDelete,
  onAssign,
}: {
  lead: Lead;
  stage: Stage;
  players: Player[];
  onMove: (id: string, to: Stage) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, player: Player | undefined) => void;
}) {
  const [showAssign, setShowAssign] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const assignRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (showAssign && assignRef.current && !assignRef.current.contains(e.target as Node)) setShowAssign(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu, showAssign]);

  return (
    <div className="bg-gray-950 border border-gray-800/60 rounded-lg p-3 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-medium text-white leading-tight">{lead.name}</h4>
          <p className="text-xs text-gray-500">{lead.company}</p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button onClick={() => setShowMenu(!showMenu)} className="text-gray-600 hover:text-gray-400 text-xs px-1">...</button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-gray-950 border border-gray-800 rounded-lg py-1 flex flex-col min-w-[120px] shadow-xl">
              {STAGES.filter((s) => s.id !== stage).map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onMove(lead.id, s.id); setShowMenu(false); }}
                  className="text-left px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
                >
                  {s.label}
                </button>
              ))}
              <div className="border-t border-gray-800 my-1" />
              <button
                onClick={() => { onDelete(lead.id); setShowMenu(false); }}
                className="text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-900 transition-colors w-full"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {lead.value && (
        <span className="text-xs font-medium text-green-400">{lead.value}</span>
      )}
      {lead.source && (
        <span className="text-[10px] text-gray-600">{lead.source}</span>
      )}
      {/* Assignee */}
      <div ref={assignRef} className="flex items-center gap-1.5 mt-1 relative">
        <button
          onClick={() => setShowAssign(!showAssign)}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          {lead.assignee ? (
            <>
              <span className={`w-5 h-5 rounded-full ${lead.assignee.color} flex items-center justify-center text-[9px] font-bold text-white`}>
                {lead.assignee.initials}
              </span>
              <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{lead.assignee.name}</span>
            </>
          ) : (
            <span className="w-5 h-5 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-[9px] text-gray-600">+</span>
          )}
        </button>

        {showAssign && (
          <div className="absolute left-0 bottom-full mb-1 z-20 bg-gray-950 border border-gray-800 rounded-lg py-1 min-w-[200px] shadow-xl max-h-[200px] overflow-y-auto">
            {lead.assignee && (
              <button
                onClick={() => { onAssign(lead.id, undefined); setShowAssign(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-900 transition-colors"
              >
                Remove assignee
              </button>
            )}
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => { onAssign(lead.id, p); setShowAssign(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                  lead.assignee?.id === p.id ? "text-green-400 bg-green-900/20" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${p.color} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                  {p.initials}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const { activeWs } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState<Stage | null>(null);
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const fetchData = useCallback(async () => {
    const [leadsRes, membersRes] = await Promise.all([
      supabase
        .from("leads")
        .select("*, assignee:members!assignee_id(*)")
        .eq("workspace_id", activeWs)
        .order("position"),
      supabase
        .from("members")
        .select("*")
        .eq("workspace_id", activeWs),
    ]);
    if (leadsRes.data) {
      setLeads(leadsRes.data.map((l: Record<string, unknown>) => ({
        ...l,
        assignee: l.assignee || undefined,
      })) as Lead[]);
    }
    if (membersRes.data) setPlayers(membersRes.data as Player[]);
    setLoading(false);
  }, [activeWs]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const leadsByStage = (stage: Stage) => leads.filter((l) => l.stage === stage);

  async function moveLead(id: string, to: Stage) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: to } : l)));
    await supabase.from("leads").update({ stage: to }).eq("id", id);
  }

  async function deleteLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    await supabase.from("leads").delete().eq("id", id);
  }

  async function assignLead(id: string, player: Player | undefined) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, assignee: player, assignee_id: player?.id ?? null } : l)));
    await supabase.from("leads").update({ assignee_id: player?.id ?? null }).eq("id", id);
  }

  async function addLead(stage: Stage) {
    if (!newName.trim()) return;
    const newLead = {
      name: newName.trim(),
      company: newCompany.trim() || "—",
      stage,
      workspace_id: activeWs,
      position: leadsByStage(stage).length,
    };
    const { data } = await supabase.from("leads").insert(newLead).select("*, assignee:members!assignee_id(*)").single();
    if (data) setLeads((prev) => [...prev, { ...data, assignee: data.assignee || undefined } as Lead]);
    setNewName("");
    setNewCompany("");
    setShowNew(null);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen md:h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg font-bold text-green-400">Leads</h2>
      </div>

      <div className="flex-1 flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 min-h-0 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x snap-mandatory md:snap-none">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className={`flex flex-col rounded-xl border-t-2 ${stage.headerBg} border border-gray-800/40 bg-black/50 overflow-hidden min-w-[280px] md:min-w-0 snap-start`}
          >
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wide">{stage.label}</h3>
                <span className="text-xs text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded-full">{leadsByStage(stage.id).length}</span>
              </div>
              <button
                onClick={() => { setShowNew(showNew === stage.id ? null : stage.id); setNewName(""); setNewCompany(""); }}
                className="text-gray-600 hover:text-white text-lg leading-none transition-colors"
              >
                +
              </button>
            </div>

            {showNew === stage.id && (
              <div className="px-2 pb-2">
                <div className="bg-gray-950 border border-gray-800/60 rounded-lg p-2 flex flex-col gap-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contact name..."
                    className="bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                  />
                  <input
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLead(stage.id)}
                    placeholder="Company..."
                    className="bg-transparent text-xs text-white placeholder-gray-600 outline-none"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => addLead(stage.id)}
                      className="text-xs px-2 py-1 rounded bg-green-900/40 text-green-400 hover:bg-green-800/50 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowNew(null)}
                      className="text-xs px-2 py-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-2">
              {leadsByStage(stage.id).map((lead) => (
                <LeadCard key={lead.id} lead={lead} stage={stage.id} players={players} onMove={moveLead} onDelete={deleteLead} onAssign={assignLead} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
