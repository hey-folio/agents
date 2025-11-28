import "./index.css";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  clientName: string;
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  teamCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
}

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  const [filter, setFilter] = useState<string>("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const filteredProjects = filter === "all"
    ? projects
    : projects.filter((p) => p.status === filter);

  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="w-full max-w-3xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-violet-700 to-violet-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Projects
          </h2>
          <div className="bg-violet-800/50 text-white px-3 py-1 rounded-md text-sm">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-violet-100 text-violet-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          All ({projects.length})
        </button>
        {["active", "planning", "on_hold", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === status
                ? "bg-violet-100 text-violet-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            No projects found
          </div>
        ) : (
          filteredProjects.map((project) => {
            const budgetPercentage = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
            const taskPercentage = project.taskCount && project.taskCount > 0
              ? ((project.completedTaskCount || 0) / project.taskCount) * 100
              : 0;

            return (
              <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{project.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-violet-600">${project.budget.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {budgetPercentage.toFixed(0)}% spent
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {formatDate(project.startDate)}
                      {project.endDate && ` - ${formatDate(project.endDate)}`}
                    </span>
                    {project.teamCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        {project.teamCount}
                      </span>
                    )}
                  </div>
                  {project.taskCount !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${taskPercentage}%` }}
                        />
                      </div>
                      <span>{project.completedTaskCount || 0}/{project.taskCount} tasks</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
