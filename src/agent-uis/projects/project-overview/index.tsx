import "./index.css";

interface TeamMember {
  id: string;
  name: string;
  role?: string;
}

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
  teamMembers: TeamMember[];
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

interface ProjectOverviewProps {
  project: Project;
  taskStats: TaskStats;
  hoursLogged?: number;
  hoursEstimated?: number;
}

export default function ProjectOverview({
  project,
  taskStats,
  hoursLogged = 0,
  hoursEstimated = 0,
}: ProjectOverviewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  const budgetPercentage = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  const taskCompletionPercentage = taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0;
  const hoursPercentage = hoursEstimated > 0 ? (hoursLogged / hoursEstimated) * 100 : 0;

  return (
    <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-violet-700 to-violet-500 px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-white font-bold text-xl flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              {project.name}
            </h2>
            <p className="text-violet-100 text-sm mt-1">{project.clientName}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
            {project.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="p-6">
        <p className="text-gray-600 mb-6">{project.description}</p>

        {/* Progress Bars */}
        <div className="space-y-4 mb-6">
          {/* Task Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Task Progress</span>
              <span className="font-medium">{taskStats.done}/{taskStats.total} tasks</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${taskCompletionPercentage}%` }}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Budget</span>
              <span className={`font-medium ${budgetPercentage > 90 ? "text-red-600" : ""}`}>
                ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetPercentage > 90 ? "bg-red-500" : budgetPercentage > 75 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Hours */}
          {hoursEstimated > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Hours</span>
                <span className={`font-medium ${hoursPercentage > 90 ? "text-red-600" : ""}`}>
                  {hoursLogged}h / {hoursEstimated}h
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    hoursPercentage > 90 ? "bg-red-500" : hoursPercentage > 75 ? "bg-yellow-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(hoursPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Task Status Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{taskStats.todo}</p>
            <p className="text-xs text-gray-500">To Do</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{taskStats.inProgress}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{taskStats.review}</p>
            <p className="text-xs text-gray-500">Review</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{taskStats.done}</p>
            <p className="text-xs text-gray-500">Done</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>Started {formatDate(project.startDate)}</span>
          </div>
          {project.endDate && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Due {formatDate(project.endDate)}</span>
            </div>
          )}
        </div>

        {/* Team */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Team ({project.teamMembers.length})</h3>
          <div className="flex flex-wrap gap-2">
            {project.teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
              >
                <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="text-sm text-gray-700">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
