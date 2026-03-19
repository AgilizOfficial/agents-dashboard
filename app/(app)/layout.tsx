"use client";

import Sidebar from "@/components/Sidebar";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <WorkspaceProvider>
      <div className="flex">
        <Sidebar />
        <main className="md:ml-56 flex-1 min-h-screen pt-14 md:pt-0">{children}</main>
      </div>
    </WorkspaceProvider>
  );
}
