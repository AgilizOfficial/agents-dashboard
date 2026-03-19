"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

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
  canSwitchWorkspace: boolean;
}

const Ctx = createContext<WorkspaceCtx>({
  activeWs: "ggv",
  setActiveWs: () => {},
  canSwitchWorkspace: false,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { profile, isSuperAdmin } = useAuth();
  const [activeWs, setActiveWs] = useState<WorkspaceId>("ggv");

  // Lock non-super-admin users to their profile workspace
  useEffect(() => {
    if (profile) {
      const ws = profile.workspace_id as WorkspaceId;
      if (!isSuperAdmin) {
        setActiveWs(ws);
      } else {
        // Super admin defaults to their profile workspace on first load
        setActiveWs(ws);
      }
    }
  }, [profile, isSuperAdmin]);

  const handleSetActiveWs = (id: WorkspaceId) => {
    if (isSuperAdmin) {
      setActiveWs(id);
    }
  };

  return (
    <Ctx.Provider value={{ activeWs, setActiveWs: handleSetActiveWs, canSwitchWorkspace: isSuperAdmin }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  return useContext(Ctx);
}
