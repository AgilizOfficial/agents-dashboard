"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { supabase } from "@/lib/supabase";

interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: Column;
  assignee?: Member;
  assignee_id?: string | null;
}

type Column = "not_started" | "in_progress" | "done";

const COLUMNS: { id: Column; label: string; headerBg: string; badgeDot: string; badgeBg: string; badgeText: string }[] = [
  { id: "not_started", label: "Not Started", headerBg: "border-t-red-500", badgeDot: "bg-red-400", badgeBg: "bg-red-900/30", badgeText: "text-red-300" },
  { id: "in_progress", label: "In Progress", headerBg: "border-t-blue-500", badgeDot: "bg-blue-400", badgeBg: "bg-blue-900/30", badgeText: "text-blue-300" },
  { id: "done", label: "Done", headerBg: "border-t-green-500", badgeDot: "bg-green-400", badgeBg: "bg-green-900/30", badgeText: "text-green-300" },
];

/* ── TaskCard ── */

function TaskCard({
  task,
  members,
  onMove,
  onAssign,
  column,
}: {
  task: Task;
  members: Member[];
  onMove: (id: string, to: Column) => void;
  onAssign: (id: string, member: Member | undefined) => void;
  column: Column;
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
    <div className="bg-gray-950 border border-gray-800/60 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-white leading-tight">{task.title}</h4>
        <div ref={menuRef} className="relative shrink-0">
          <button onClick={() => setShowMenu(!showMenu)} className="text-gray-600 hover:text-gray-400 text-xs px-1">...</button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-gray-950 border border-gray-800 rounded-lg py-1 flex flex-col min-w-[120px] shadow-xl">
              {COLUMNS.filter((c) => c.id !== column).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onMove(task.id, c.id); setShowMenu(false); }}
                  className="text-left px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
      {(() => {
        const col = COLUMNS.find((c) => c.id === column)!;
        return (
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${col.badgeBg} ${col.badgeText}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${col.badgeDot}`} />
            {col.label}
          </span>
        );
      })()}
      <div ref={assignRef} className="flex items-center gap-1.5 mt-1 relative">
        <button
          onClick={() => setShowAssign(!showAssign)}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          {task.assignee ? (
            <>
              <span className={`w-5 h-5 rounded-full ${task.assignee.color} flex items-center justify-center text-[9px] font-bold text-white`}>
                {task.assignee.initials}
              </span>
              <span className="text-[10px] text-gray-500">{task.assignee.name}</span>
            </>
          ) : (
            <span className="w-5 h-5 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-[9px] text-gray-600">+</span>
          )}
        </button>

        {showAssign && (
          <div className="absolute left-0 bottom-full mb-1 z-20 bg-gray-950 border border-gray-800 rounded-lg py-1 min-w-[160px] shadow-xl max-h-[200px] overflow-y-auto">
            {task.assignee && (
              <button
                onClick={() => { onAssign(task.id, undefined); setShowAssign(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-900 transition-colors"
              >
                Remove assignee
              </button>
            )}
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => { onAssign(task.id, m); setShowAssign(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                  task.assignee?.id === m.id ? "text-green-400 bg-green-900/20" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${m.color} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                  {m.initials}
                </span>
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ── */

export default function TasksPage() {
  const { activeWs } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState<Column | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const fetchData = useCallback(async () => {
    const [tasksRes, membersRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*, assignee:members!assignee_id(*)")
        .eq("workspace_id", activeWs)
        .order("position"),
      supabase
        .from("members")
        .select("*")
        .in("workspace_id", activeWs === "ggv" ? ["ggv"] : [activeWs, "ggv"]),
    ]);
    if (tasksRes.data) {
      setTasks(tasksRes.data.map((t: Record<string, unknown>) => ({
        ...t,
        assignee: t.assignee || undefined,
      })) as Task[]);
    }
    if (membersRes.data) setMembers(membersRes.data as Member[]);
    setLoading(false);
  }, [activeWs]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const tasksByColumn = (col: Column) => tasks.filter((t) => t.status === col);

  async function moveTask(id: string, to: Column) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: to } : t)));
    await supabase.from("tasks").update({ status: to }).eq("id", id);
  }

  async function assignTask(id: string, member: Member | undefined) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, assignee: member, assignee_id: member?.id ?? null } : t)));
    await supabase.from("tasks").update({ assignee_id: member?.id ?? null }).eq("id", id);
  }

  async function addTask(column: Column) {
    if (!newTitle.trim()) return;
    const newTask = {
      title: newTitle.trim(),
      description: "",
      status: column,
      workspace_id: activeWs,
      position: tasksByColumn(column).length,
    };
    const { data } = await supabase.from("tasks").insert(newTask).select("*, assignee:members!assignee_id(*)").single();
    if (data) setTasks((prev) => [...prev, { ...data, assignee: data.assignee || undefined } as Task]);
    setNewTitle("");
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
    <div className="p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-green-400">Tasks</h2>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className={`flex flex-col rounded-xl border-t-2 ${col.headerBg} border border-gray-800/40 bg-black/50 overflow-hidden`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                <span className="text-xs text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded-full">{tasksByColumn(col.id).length}</span>
              </div>
              <button
                onClick={() => { setShowNew(showNew === col.id ? null : col.id); setNewTitle(""); }}
                className="text-gray-600 hover:text-white text-lg leading-none transition-colors"
              >
                +
              </button>
            </div>

            {/* New task input */}
            {showNew === col.id && (
              <div className="px-3 pb-2">
                <div className="bg-gray-950 border border-gray-800/60 rounded-lg p-2 flex flex-col gap-2">
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask(col.id)}
                    placeholder="Task title..."
                    className="bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addTask(col.id)}
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

            {/* Task cards */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
              {tasksByColumn(col.id).map((task) => (
                <TaskCard key={task.id} task={task} members={members} onMove={moveTask} onAssign={assignTask} column={col.id} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
