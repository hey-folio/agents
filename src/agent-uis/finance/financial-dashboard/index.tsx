import "./index.css";
import { useState } from "react";

interface FinancialDashboardProps {
  period: string;
  startDate: string;
  endDate: string;
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  expenseCount: number;
  byCategory: Record<string, number>;
  byStatus?: Record<string, number>;
  groupedBy?: string;
  groupedData?: Record<string, { count: number; total: number }>;
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

const categoryColors: Record<string, string> = {
  travel: "bg-blue-500",
  meals: "bg-green-500",
  software: "bg-purple-500",
  equipment: "bg-orange-500",
  client_entertainment: "bg-pink-500",
  office_supplies: "bg-yellow-500",
  professional_development: "bg-indigo-500",
  other: "bg-gray-500",
};

const periodLabels: Record<string, string> = {
  week: "Past Week",
  month: "Past Month",
  quarter: "Past Quarter",
  year: "Past Year",
  all: "All Time",
};

export default function FinancialDashboard({
  period,
  startDate,
  endDate,
  totalExpenses,
  approvedExpenses,
  pendingExpenses,
  expenseCount,
  byCategory,
  byStatus: _byStatus,
  groupedBy,
  groupedData,
}: FinancialDashboardProps) {
  // byStatus is available for future use in status breakdown charts
  void _byStatus;
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown">("overview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Sort categories by amount
  const sortedCategories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .filter(([, amount]) => amount > 0);

  const maxCategoryAmount = Math.max(...Object.values(byCategory), 1);

  // For grouped data display
  const sortedGroupedData = groupedData
    ? Object.entries(groupedData).sort(([, a], [, b]) => b.total - a.total)
    : [];

  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl tracking-tight flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Financial Dashboard
          </h2>
          <div className="bg-emerald-800/50 text-white px-3 py-1 rounded-md text-sm backdrop-blur-sm border border-emerald-400/30">
            {periodLabels[period] || period}
            {startDate && endDate && (
              <span className="ml-2 text-emerald-200">
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 bg-gradient-to-b from-emerald-50 to-white">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between">
              <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-gray-500 mt-1">{expenseCount} expense{expenseCount !== 1 ? "s" : ""}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between">
              <p className="text-gray-500 text-sm font-medium">Approved</p>
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(approvedExpenses)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {totalExpenses > 0 ? ((approvedExpenses / totalExpenses) * 100).toFixed(0) : 0}% of total
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between">
              <p className="text-gray-500 text-sm font-medium">Pending</p>
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{formatCurrency(pendingExpenses)}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between">
              <p className="text-gray-500 text-sm font-medium">Avg per Expense</p>
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(expenseCount > 0 ? totalExpenses / expenseCount : 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Per transaction</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === "overview"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Category Breakdown
            </button>
            {groupedData && (
              <button
                onClick={() => setActiveTab("breakdown")}
                className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                  activeTab === "breakdown"
                    ? "text-emerald-600 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                By {groupedBy}
              </button>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        {activeTab === "overview" && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Spending by Category
            </h3>

            {sortedCategories.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expense data available</p>
            ) : (
              <div className="space-y-3">
                {sortedCategories.map(([category, amount]) => (
                  <div key={category} className="group hover:bg-emerald-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${categoryColors[category] || "bg-gray-500"}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {categoryLabels[category] || category}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(amount)}</span>
                    </div>
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 ${categoryColors[category] || "bg-gray-500"} transition-all duration-300`}
                        style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {((amount / totalExpenses) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grouped Data Breakdown */}
        {activeTab === "breakdown" && groupedData && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Expenses by {groupedBy}
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {groupedBy}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedGroupedData.map(([key, data]) => (
                    <tr key={key} className="hover:bg-emerald-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {categoryLabels[key] || key}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">{data.count}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(data.total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatCurrency(data.count > 0 ? data.total / data.count : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
