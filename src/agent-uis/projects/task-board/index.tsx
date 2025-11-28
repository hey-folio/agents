import "./index.css";

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  assigneeId?: string;
  assigneeName?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

interface TaskBoardProps {
  tasks: Task[];
  projectName?: string;
}

export default function TaskBoard({ tasks, projectName }: TaskBoardProps) {
  const columns: { key: Task["status"]; label: string; color: string }[] = [
    { key: "todo", label: "To Do", color: "bg-gray-100" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-100" },
    { key: "review", label: "Review", color: "bg-purple-100" },
    { key: "done", label: "Done", color: "bg-green-100" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", className: "text-red-600" };
    if (diffDays === 0) return { text: "Today", className: "text-orange-600" };
    if (diffDays === 1) return { text: "Tomorrow", className: "text-yellow-600" };
    if (diffDays <= 7) return { text: `${diffDays} days`, className: "text-gray-600" };

    return {
      text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      className: "text-gray-500",
    };
  };

  const getTasksByStatus = (status: Task["status"]) => tasks.filter((t) => t.status === status);

  return (
    <div className="w-full max-w-5xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-violet-700 to-violet-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            {projectName ? `${projectName} Tasks` : "Task Board"}
          </h2>
          <div className="bg-violet-800/50 text-white px-3 py-1 rounded-md text-sm">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.key);
            return (
              <div key={column.key} className="w-64 flex-shrink-0">
                <div className={`${column.color} rounded-lg p-2 mb-3`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{column.label}</span>
                    <span className="text-sm text-gray-500">{columnTasks.length}</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(task.priority)}`} />
                          <span className="font-medium text-gray-900 text-sm flex-1">{task.title}</span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          {task.assigneeName && (
                            <span className="text-gray-500 truncate max-w-[100px]">{task.assigneeName}</span>
                          )}
                          {task.dueDate && (
                            <span className={formatDate(task.dueDate).className}>
                              {formatDate(task.dueDate).text}
                            </span>
                          )}
                        </div>
                        {task.estimatedHours && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {task.actualHours ?? 0}h / {task.estimatedHours}h
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
