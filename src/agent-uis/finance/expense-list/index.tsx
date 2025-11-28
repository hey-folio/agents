import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  projectName?: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  filters: Record<string, unknown>;
  toolCallId?: string;
  allowApproval?: boolean;
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

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  submitted: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-100" },
  approved: { label: "Approved", color: "text-green-700", bg: "bg-green-100" },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-100" },
  paid: { label: "Paid", color: "text-blue-700", bg: "bg-blue-100" },
};

export default function ExpenseList({ expenses, filters, toolCallId, allowApproval }: ExpenseListProps) {
  const [sortField, setSortField] = useState<keyof Expense>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [actionTaken, setActionTaken] = useState<Record<string, "approve" | "reject">>({});

  const thread = useStreamContext();

  const handleApproval = (expense: Expense, action: "approve" | "reject") => {
    setActionTaken((prev) => ({ ...prev, [expense.id]: action }));
    setSelectedExpense(null);
    setApprovalNotes("");

    if (toolCallId) {
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
                    action,
                    expenseId: expense.id,
                    notes: approvalNotes || undefined,
                    message: `Expense ${action === "approve" ? "approved" : "rejected"} successfully`,
                  }),
                },
              ],
            },
          },
        }
      );
    }
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === undefined || bVal === undefined) return 0;
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Expense) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const SortIcon = ({ field }: { field: keyof Expense }) => (
    <span className="ml-1 text-gray-400">
      {sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  if (expenses.length === 0) {
    return (
      <div className="w-full rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white p-8 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500">No expenses found</p>
        {Object.keys(filters).length > 0 && (
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl tracking-tight flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Expenses
          </h2>
          <div className="bg-emerald-800/50 text-white px-3 py-1 rounded-md text-sm backdrop-blur-sm border border-emerald-400/30">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} · {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort("date")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Date <SortIcon field="date" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th
                onClick={() => handleSort("category")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Category <SortIcon field="category" />
                </div>
              </th>
              <th
                onClick={() => handleSort("employeeName")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Submitted By <SortIcon field="employeeName" />
                </div>
              </th>
              <th
                onClick={() => handleSort("amount")}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-end">
                  Amount <SortIcon field="amount" />
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-center">
                  Status <SortIcon field="status" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedExpenses.map((expense) => {
              const status = statusConfig[expense.status];
              return (
                <tr
                  key={expense.id}
                  className="hover:bg-emerald-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedExpense(expense)}
                >
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 font-medium">{expense.description}</div>
                    {expense.projectName && (
                      <div className="text-xs text-gray-500">{expense.projectName}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {categoryLabels[expense.category] || expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {expense.employeeName}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {actionTaken[expense.id] ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionTaken[expense.id] === "approve" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {actionTaken[expense.id] === "approve" ? "Approved" : "Rejected"}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedExpense(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
              <div className="flex justify-between items-start">
                <h3 className="text-white font-bold text-lg">Expense Details</h3>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedExpense.amount)}</p>
                  <p className="text-sm text-gray-500">{formatDate(selectedExpense.date)}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedExpense.status].bg} ${statusConfig[selectedExpense.status].color}`}>
                  {statusConfig[selectedExpense.status].label}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Description</p>
                  <p className="text-sm text-gray-900">{selectedExpense.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Category</p>
                    <p className="text-sm text-gray-900">{categoryLabels[selectedExpense.category]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Submitted By</p>
                    <p className="text-sm text-gray-900">{selectedExpense.employeeName}</p>
                  </div>
                </div>
                {selectedExpense.projectName && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Project</p>
                    <p className="text-sm text-gray-900">{selectedExpense.projectName}</p>
                  </div>
                )}
                {selectedExpense.approvedByName && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      {selectedExpense.status === "rejected" ? "Rejected By" : "Approved By"}
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedExpense.approvedByName}
                      {selectedExpense.approvedAt && (
                        <span className="text-gray-500"> on {formatDate(selectedExpense.approvedAt)}</span>
                      )}
                    </p>
                  </div>
                )}
                {selectedExpense.rejectionReason && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Rejection Reason</p>
                    <p className="text-sm text-red-600">{selectedExpense.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Approval Actions */}
              {allowApproval && selectedExpense.status === "submitted" && !actionTaken[selectedExpense.id] && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Notes (optional)</label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Add a note about this decision..."
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApproval(selectedExpense, "reject")}
                      className="flex-1 bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproval(selectedExpense, "approve")}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Approve
                    </button>
                  </div>
                </div>
              )}

              {/* Action Already Taken */}
              {actionTaken[selectedExpense.id] && (
                <div className="border-t border-gray-200 pt-4">
                  <div className={`text-center p-3 rounded-lg ${actionTaken[selectedExpense.id] === "approve" ? "bg-green-50" : "bg-red-50"}`}>
                    <p className={`font-medium ${actionTaken[selectedExpense.id] === "approve" ? "text-green-700" : "text-red-700"}`}>
                      {actionTaken[selectedExpense.id] === "approve" ? "Approved" : "Rejected"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
