"use client";

import { useState, useEffect, useCallback } from "react";
import ProjectCard from "@/components/ProjectCard";
import { useWorkspace } from "@/lib/workspace-context";
import { supabase } from "@/lib/supabase";

interface Project {
  id: string;
  name: string;
  initials: string;
  description: string;
  status: "active" | "planning" | "paused";
  image?: string;
}

export default function ProjectsPage() {
  const { activeWs } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", activeWs)
      .order("created_at");
    if (data) setProjects(data as Project[]);
    setLoading(false);
  }, [activeWs]);

  useEffect(() => {
    setLoading(true);
    fetchProjects();
  }, [fetchProjects]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h2 className="text-lg font-bold text-green-400 mb-4 md:mb-6">Projects</h2>
      {projects.length === 0 ? (
        <div className="rounded-xl border border-green-900/30 bg-black p-8 text-center">
          <p className="text-gray-500 text-sm">Este workspace não tem projetos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      )}
    </div>
  );
}
