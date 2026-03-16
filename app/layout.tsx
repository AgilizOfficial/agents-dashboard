import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agents Dashboard",
  description: "Monitor e controlo dos agentes OpenClaw",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="bg-gray-950 text-gray-100">
      <body className="min-h-screen font-mono antialiased">{children}</body>
    </html>
  );
}
