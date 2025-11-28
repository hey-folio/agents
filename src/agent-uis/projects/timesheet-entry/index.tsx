import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  projectId: string;
}

interface TimesheetEntryProps {
  toolCallId: string;
  projects: Project[];
  tasks: Task[];
  employeeId: string;
  suggestedDate?: string;
}

export default function TimesheetEntry({
  toolCallId,
  projects,
  tasks,
  employeeId,
  suggestedDate,
}: TimesheetEntryProps) {
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(suggestedDate || new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const thread = useStreamContext();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const handleSubmit = () => {
    if (!projectId || !hours || Number(hours) <= 0) return;

    const entryData = {
      employeeId,
      projectId,
      taskId: taskId || undefined,
      date,
      hours: Number(hours),
      description: description.trim() || undefined,
    };

    setIsSubmitted(true);

    thread.submit(
      {},
      {
        command: {
          update: {
            messages: [
              {
                type: "tool",
                tool_call_id: toolCallId,
                content: JSON.stringify({
                  success: true,
                  message: `Logged ${hours} hours for ${projects.find((p) => p.id === projectId)?.name}`,
                  entry: entryData,
                }),
              },
            ],
          },
        },
      }
    );
  };

  if (isSubmitted) {
    const project = projects.find((p) => p.id === projectId);
    return (
      <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Time Logged
          </h2>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-emerald-600 mb-2">{hours} hours</p>
          <p className="text-gray-900 font-medium">{project?.name}</p>
          <p className="text-gray-500 text-sm">{date}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
        <h2 className="text-white font-bold text-xl flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Log Time
        </h2>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setTaskId("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {projectId && projectTasks.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task (optional)</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">No specific task</option>
              {projectTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hours *</label>
          <div className="flex gap-2">
            {[0.5, 1, 2, 4, 8].map((preset) => (
              <button
                key={preset}
                onClick={() => setHours(String(preset))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hours === String(preset)
                    ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent"
                }`}
              >
                {preset}h
              </button>
            ))}
          </div>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Or enter custom hours"
            min="0.25"
            max="24"
            step="0.25"
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!projectId || !hours || Number(hours) <= 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Log Time
        </button>
      </div>
    </div>
  );
}
