"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export const WORKSPACES = [
  { id: "ggv", label: "ggv" },
  { id: "agiliz", label: "Agiliz" },
  { id: "alburiware", label: "Alburiware" },
  { id: "avgroup", label: "AV Group" },
] as const;

export type WorkspaceId = (typeof WORKSPACES)[number]["id"];

interface WorkspaceCtx {
  activeWs: WorkspaceId;
  setActiveWs: (id: WorkspaceId) => void;
}

const Ctx = createContext<WorkspaceCtx>({ activeWs: "ggv", setActiveWs: () => {} });

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWs, setActiveWs] = useState<WorkspaceId>("ggv");
  return <Ctx.Provider value={{ activeWs, setActiveWs }}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  return useContext(Ctx);
}
