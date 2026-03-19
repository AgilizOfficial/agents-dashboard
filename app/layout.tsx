import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { WorkspaceProvider } from "@/lib/workspace-context";

export const metadata: Metadata = {
  title: "Agents Hub",
  description: "Monitor e controlo dos agentes OpenClaw",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="bg-black text-gray-100">
      <body className="min-h-screen font-mono antialiased">
        <WorkspaceProvider>
          <div className="flex">
            <Sidebar />
            <main className="ml-56 flex-1 min-h-screen">{children}</main>
          </div>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
