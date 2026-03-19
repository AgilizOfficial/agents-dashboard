"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWorkspace, WORKSPACES } from "@/lib/workspace-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Agents Hub", icon: "grid" },
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "/tasks", label: "Tasks", icon: "check" },
  { href: "/leads", label: "Leads", icon: "users" },
];

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "grid":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
        </svg>
      );
    case "folder":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      );
    case "users":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      );
    case "check":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const [wsOpen, setWsOpen] = useState(false);
  const { activeWs, setActiveWs } = useWorkspace();

  const currentWs = WORKSPACES.find((w) => w.id === activeWs) ?? WORKSPACES[0];

  return (
    <aside className="w-56 h-screen bg-black border-r border-green-900/20 flex flex-col fixed left-0 top-0">
      {/* Workspace switcher */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <button
            onClick={() => setWsOpen(!wsOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 h-5 rounded-md bg-green-500 shrink-0" />
              <span className="text-sm font-medium text-white truncate">{currentWs.label}</span>
            </div>
            <svg className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform ${wsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {wsOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-gray-950 border border-green-900/30 rounded-lg py-1 shadow-xl">
              {WORKSPACES.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { setActiveWs(ws.id); setWsOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    ws.id === activeWs ? "text-green-400 bg-green-900/20" : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-sm shrink-0 ${ws.id === activeWs ? "bg-green-500" : "bg-gray-700"}`} />
                  <span className="truncate">{ws.label}</span>
                  {ws.id === activeWs && (
                    <svg className="w-3.5 h-3.5 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-green-900/20" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-900/30 text-green-400 border-l-2 border-green-400"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/50"
              }`}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-green-900/20">
        <p className="text-[10px] text-gray-700">OpenClaw Gateway</p>
      </div>
    </aside>
  );
}
