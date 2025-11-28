import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface Expense {
  id: string;
  employeeName: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  projectName?: string;
  status: string;
}

interface ExpenseApprovalProps {
  toolCallId: string;
  expense: Expense;
  suggestedAction: "approve" | "reject";
  notes?: string;
}

const categoryLabels: Record<string, string> = {
  travel: "Travel",
  meals: "Meals",
  software: "Software",
  equipment: "Equipment",
  client_entertainment: "Client Entertainment",
  office_supplies: "Office Supplies",
  professional_development: "Professional Development",
  other: "Other",
};

export default function ExpenseApproval({
  toolCallId,
  expense,
  suggestedAction,
  notes: initialNotes,
}: ExpenseApprovalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState(initialNotes || "");
  const [completed, setCompleted] = useState(false);

  const thread = useStreamContext();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAction = (selectedAction: "approve" | "reject") => {
    setAction(selectedAction);
    setCompleted(true);

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
                  action: selectedAction,
                  expenseId: expense.id,
                  notes: notes || undefined,
                  message: `Expense ${selectedAction === "approve" ? "approved" : "rejected"} successfully`,
                }),
              },
            ],
          },
        },
      }
    );
  };

  if (completed) {
    const isApproved = action === "approve";
    return (
      <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
        <div className={`bg-gradient-to-r ${isApproved ? "from-emerald-700 to-emerald-500" : "from-red-700 to-red-500"} px-6 py-4`}>
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              {isApproved ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
            </svg>
            Expense {isApproved ? "Approved" : "Rejected"}
          </h2>
        </div>
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${isApproved ? "bg-emerald-100" : "bg-red-100"} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-8 h-8 ${isApproved ? "text-emerald-600" : "text-red-600"}`} fill="currentColor" viewBox="0 0 20 20">
              {isApproved ? (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              )}
            </svg>
          </div>
          <p className="text-gray-900 font-medium text-lg mb-2">
            {formatCurrency(expense.amount)} {isApproved ? "approved" : "rejected"}
          </p>
          <p className="text-gray-500 text-sm">
            {expense.employeeName}'s expense has been {isApproved ? "approved" : "rejected"}.
          </p>
          {notes && (
            <p className="text-gray-400 text-sm mt-2 italic">
              Note: {notes}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-4">
        <h2 className="text-white font-bold text-xl flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Review Expense
        </h2>
      </div>

      <div className="p-6">
        {/* Expense Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
              <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              Pending Review
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Submitted by</span>
              <span className="text-gray-900 font-medium">{expense.employeeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-900">{categoryLabels[expense.category] || expense.category}</span>
            </div>
            {expense.projectName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Project</span>
                <span className="text-gray-900">{expense.projectName}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
            <p className="text-sm text-gray-900">{expense.description}</p>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            placeholder="Add a note about this decision..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => handleAction("reject")}
            className="flex-1 bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Reject
          </button>
          <button
            onClick={() => handleAction("approve")}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Approve
          </button>
        </div>

        {suggestedAction && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Suggested action: {suggestedAction}
          </p>
        )}
      </div>
    </div>
  );
}
