import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface Project {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

interface TaskFormProps {
  toolCallId: string;
  projects: Project[];
  employees: Employee[];
  defaultProjectId?: string;
}

export default function TaskForm({
  toolCallId,
  projects,
  employees,
  defaultProjectId,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const thread = useStreamContext();

  const handleSubmit = () => {
    if (!title.trim() || !projectId) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      projectId,
      assigneeId: assigneeId || undefined,
      priority,
      dueDate: dueDate || undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
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
                  message: `Created task: ${title}`,
                  task: taskData,
                }),
              },
            ],
          },
        },
      }
    );
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
        <div className="bg-gradient-to-r from-violet-700 to-violet-500 px-6 py-4">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Task Created
          </h2>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium text-lg mb-2">{title}</p>
          <p className="text-gray-500">{projects.find((p) => p.id === projectId)?.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-violet-700 to-violet-500 px-6 py-4">
        <h2 className="text-white font-bold text-xl flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create Task
        </h2>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Design homepage mockup"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this task..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="0"
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !projectId}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Create Task
        </button>
      </div>
    </div>
  );
}
