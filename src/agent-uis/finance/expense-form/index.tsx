import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface ExpenseFormProps {
  toolCallId: string;
  mode: "create" | "edit";
  prefilled?: {
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    projectId?: string;
  };
}

const categories = [
  { value: "travel", label: "Travel" },
  { value: "meals", label: "Meals" },
  { value: "software", label: "Software" },
  { value: "equipment", label: "Equipment" },
  { value: "client_entertainment", label: "Client Entertainment" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "professional_development", label: "Professional Development" },
  { value: "other", label: "Other" },
];

const projects = [
  { id: "proj-001", name: "TechStart Brand Refresh" },
  { id: "proj-002", name: "GreenLife E-commerce Platform" },
  { id: "proj-003", name: "FinanceHub Mobile App" },
  { id: "proj-004", name: "Artisan Coffee Website Redesign" },
];

export default function ExpenseForm({ toolCallId, mode, prefilled }: ExpenseFormProps) {
  const [amount, setAmount] = useState(prefilled?.amount?.toString() || "");
  const [category, setCategory] = useState(prefilled?.category || "");
  const [description, setDescription] = useState(prefilled?.description || "");
  const [date, setDate] = useState(prefilled?.date || new Date().toISOString().split("T")[0]);
  const [projectId, setProjectId] = useState(prefilled?.projectId || "");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const thread = useStreamContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!category) {
      setError("Please select a category");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    const expenseData = {
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      date,
      projectId: projectId || undefined,
      projectName: projectId ? projects.find((p) => p.id === projectId)?.name : undefined,
    };

    setSubmitted(true);

    // Submit to the thread
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
                  message: "Expense submitted successfully",
                  expense: expenseData,
                }),
              },
            ],
          },
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Expense Submitted
          </h2>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium text-lg mb-2">
            ${parseFloat(amount).toFixed(2)} expense submitted
          </p>
          <p className="text-gray-500 text-sm">
            Your expense for "{description}" has been submitted for approval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
        <h2 className="text-white font-bold text-xl flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {mode === "create" ? "Submit Expense" : "Edit Expense"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (USD) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="What was this expense for?"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Project (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project (Optional)
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">No project</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          Submit Expense
        </button>
      </form>
    </div>
  );
}
