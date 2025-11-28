import { FinanceState, FinanceUpdate } from "../types";
import { ChatAnthropic } from "@langchain/anthropic";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import type ComponentMap from "../../../agent-uis/index";
import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { findToolCall } from "../../find-tool-call";
import { jsonStore } from "../../operations-team/utils/json-store";
import {
  Expense,
  ExpenseCategorySchema,
  ExpenseStatusSchema,
} from "../../operations-team/types";

// Tool schemas
const submitExpenseSchema = z.object({
  amount: z.number().positive().describe("Expense amount in USD"),
  category: ExpenseCategorySchema.describe("Expense category"),
  description: z.string().describe("Description of the expense"),
  date: z.string().describe("Date of expense (YYYY-MM-DD format)"),
  projectId: z.string().optional().describe("Associated project ID if applicable"),
});

const listExpensesSchema = z.object({
  status: ExpenseStatusSchema.optional().describe("Filter by status (draft, submitted, approved, rejected, paid)"),
  employeeId: z.string().optional().describe("Filter by employee ID"),
  category: ExpenseCategorySchema.optional().describe("Filter by category"),
  limit: z.number().optional().describe("Maximum number of expenses to return"),
});

const reviewExpenseSchema = z.object({
  expenseId: z.string().describe("ID of expense to review"),
  action: z.enum(["approve", "reject"]).describe("Approval action"),
  notes: z.string().optional().describe("Review notes or rejection reason"),
});

const getExpenseSchema = z.object({
  expenseId: z.string().describe("ID of expense to retrieve"),
});

const getFinancialSummarySchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).describe("Summary period"),
});

const analyzeExpensesSchema = z.object({
  groupBy: z.enum(["category", "project", "employee", "status"]).describe("Grouping dimension"),
});

const FINANCE_TOOLS = [
  {
    name: "submit-expense",
    description: "Submit a new expense for reimbursement. Use this when someone wants to submit, create, or add an expense.",
    schema: submitExpenseSchema,
  },
  {
    name: "list-expenses",
    description: "List expenses with optional filters. Use this to show expenses, view expense history, or find specific expenses.",
    schema: listExpensesSchema,
  },
  {
    name: "review-expense",
    description: "Approve or reject a submitted expense. Use this when someone needs to approve or reject an expense.",
    schema: reviewExpenseSchema,
  },
  {
    name: "get-expense",
    description: "Get details of a specific expense by ID.",
    schema: getExpenseSchema,
  },
  {
    name: "get-financial-summary",
    description: "Get a financial summary showing total expenses, revenue, and key metrics for a time period.",
    schema: getFinancialSummarySchema,
  },
  {
    name: "analyze-expenses",
    description: "Analyze expenses grouped by category, project, employee, or status. Use for expense breakdowns and reports.",
    schema: analyzeExpensesSchema,
  },
];

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  temperature: 0,
});

// Helper to get date range for period
function getDateRangeForPeriod(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(end.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return { start, end };
}

export async function callFinanceTools(
  state: FinanceState,
  config: LangGraphRunnableConfig
): Promise<FinanceUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);

  const message = await llm.bindTools(FINANCE_TOOLS).invoke([
    {
      role: "system",
      content: `You are a finance assistant for a digital design agency. You help with:
- Submitting and tracking expenses
- Approving or rejecting expenses
- Generating financial reports and summaries
- Analyzing spending patterns

When users ask about expenses, use the appropriate tools. Be helpful and concise.
The current user is "emp-003" (Emily Rodriguez) unless specified otherwise.
Today's date is ${new Date().toISOString().split("T")[0]}.`,
    },
    ...state.messages,
  ]);

  // Handle submit-expense
  const submitToolCall = message.tool_calls?.find(
    findToolCall("submit-expense")<typeof submitExpenseSchema>
  );

  if (submitToolCall) {
    // Create the expense form for user to confirm/edit
    ui.push(
      {
        name: "expense-form",
        props: {
          toolCallId: submitToolCall.id ?? "",
          mode: "create" as const,
          prefilled: {
            amount: submitToolCall.args.amount,
            category: submitToolCall.args.category,
            description: submitToolCall.args.description,
            date: submitToolCall.args.date,
            projectId: submitToolCall.args.projectId,
          },
        },
      },
      { message }
    );
  }

  // Handle list-expenses
  const listToolCall = message.tool_calls?.find(
    findToolCall("list-expenses")<typeof listExpensesSchema>
  );

  if (listToolCall) {
    const filters: Partial<Expense> = {};
    if (listToolCall.args.status) filters.status = listToolCall.args.status;
    if (listToolCall.args.employeeId) filters.employeeId = listToolCall.args.employeeId;
    if (listToolCall.args.category) filters.category = listToolCall.args.category;

    let expenses = jsonStore.query<Expense>("expenses", filters);

    // Sort by date descending
    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply limit
    if (listToolCall.args.limit) {
      expenses = expenses.slice(0, listToolCall.args.limit);
    }

    // Enable approval actions if filtering for submitted expenses
    const allowApproval = listToolCall.args.status === "submitted";

    ui.push(
      {
        name: "expense-list",
        props: {
          expenses,
          filters: listToolCall.args,
          toolCallId: allowApproval ? listToolCall.id : undefined,
          allowApproval,
        },
      },
      { message }
    );
  }

  // Handle review-expense
  const reviewToolCall = message.tool_calls?.find(
    findToolCall("review-expense")<typeof reviewExpenseSchema>
  );

  if (reviewToolCall) {
    const expense = jsonStore.findById<Expense>("expenses", reviewToolCall.args.expenseId);

    if (expense) {
      ui.push(
        {
          name: "expense-approval",
          props: {
            toolCallId: reviewToolCall.id ?? "",
            expense,
            suggestedAction: reviewToolCall.args.action,
            notes: reviewToolCall.args.notes,
          },
        },
        { message }
      );
    }
  }

  // Handle get-expense
  const getExpenseToolCall = message.tool_calls?.find(
    findToolCall("get-expense")<typeof getExpenseSchema>
  );

  if (getExpenseToolCall) {
    const expense = jsonStore.findById<Expense>("expenses", getExpenseToolCall.args.expenseId);

    if (expense) {
      ui.push(
        {
          name: "expense-list",
          props: {
            expenses: [expense],
            filters: {},
          },
        },
        { message }
      );
    }
  }

  // Handle get-financial-summary
  const summaryToolCall = message.tool_calls?.find(
    findToolCall("get-financial-summary")<typeof getFinancialSummarySchema>
  );

  if (summaryToolCall) {
    const { start, end } = getDateRangeForPeriod(summaryToolCall.args.period);
    const expenses = jsonStore.read<Expense>("expenses");

    const filteredExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= start && expenseDate <= end;
    });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const approvedExpenses = filteredExpenses
      .filter((e) => e.status === "approved" || e.status === "paid")
      .reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = filteredExpenses
      .filter((e) => e.status === "submitted")
      .reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    // Group by status
    const byStatus: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    });

    ui.push(
      {
        name: "financial-dashboard",
        props: {
          period: summaryToolCall.args.period,
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
          totalExpenses,
          approvedExpenses,
          pendingExpenses,
          expenseCount: filteredExpenses.length,
          byCategory,
          byStatus,
        },
      },
      { message }
    );
  }

  // Handle analyze-expenses
  const analyzeToolCall = message.tool_calls?.find(
    findToolCall("analyze-expenses")<typeof analyzeExpensesSchema>
  );

  if (analyzeToolCall) {
    const expenses = jsonStore.read<Expense>("expenses");

    const groupedData: Record<string, { count: number; total: number }> = {};

    expenses.forEach((e) => {
      let key: string;
      switch (analyzeToolCall.args.groupBy) {
        case "category":
          key = e.category;
          break;
        case "project":
          key = e.projectName || "No Project";
          break;
        case "employee":
          key = e.employeeName;
          break;
        case "status":
          key = e.status;
          break;
        default:
          key = "Unknown";
      }

      if (!groupedData[key]) {
        groupedData[key] = { count: 0, total: 0 };
      }
      groupedData[key].count += 1;
      groupedData[key].total += e.amount;
    });

    ui.push(
      {
        name: "financial-dashboard",
        props: {
          period: "all",
          startDate: "",
          endDate: "",
          totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
          approvedExpenses: expenses
            .filter((e) => e.status === "approved" || e.status === "paid")
            .reduce((sum, e) => sum + e.amount, 0),
          pendingExpenses: expenses
            .filter((e) => e.status === "submitted")
            .reduce((sum, e) => sum + e.amount, 0),
          expenseCount: expenses.length,
          byCategory: Object.fromEntries(
            Object.entries(groupedData).map(([k, v]) => [k, v.total])
          ),
          byStatus: {},
          groupedBy: analyzeToolCall.args.groupBy,
          groupedData,
        },
      },
      { message }
    );
  }

  return {
    messages: [message],
    ui: ui.items,
    timestamp: Date.now(),
  };
}
