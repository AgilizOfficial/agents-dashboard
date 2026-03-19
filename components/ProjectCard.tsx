interface Project {
  name: string;
  initials: string;
  description: string;
  status: "active" | "planning" | "paused";
  image?: string;
}

const STATUS_STYLES: Record<Project["status"], string> = {
  active: "bg-green-900/50 text-green-400 border-green-800/50",
  planning: "bg-yellow-900/40 text-yellow-400 border-yellow-800/50",
  paused: "bg-gray-900 text-gray-500 border-gray-800/50",
};

const STATUS_LABELS: Record<Project["status"], string> = {
  active: "● ativo",
  planning: "◐ planeamento",
  paused: "○ pausado",
};

export default function ProjectCard({ name, initials, description, status, image }: Project) {
  return (
    <div className="rounded-xl border border-green-700/50 bg-black p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {image ? (
            <img src={image} alt={name} className="w-8 h-8 rounded-md object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-md bg-green-900/40 border border-green-800/50 flex items-center justify-center text-xs font-bold text-green-400">
              {initials}
            </span>
          )}
          <div>
            <div className="font-semibold text-sm text-white">{name}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap border ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>
    </div>
  );
}
