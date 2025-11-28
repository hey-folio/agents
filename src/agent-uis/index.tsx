// Finance Agent UI Components
import ExpenseList from "./finance/expense-list";
import ExpenseForm from "./finance/expense-form";
import ExpenseApproval from "./finance/expense-approval";
import FinancialDashboard from "./finance/financial-dashboard";

// Operations Agent UI Components
import FlightSearch from "./operations/flight-search";
import HotelSearch from "./operations/hotel-search";
import BookingList from "./operations/booking-list";
import MeetingScheduler from "./operations/meeting-scheduler";
import MeetingList from "./operations/meeting-list";

// Projects Agent UI Components
import TaskBoard from "./projects/task-board";
import TaskForm from "./projects/task-form";
import ProjectOverview from "./projects/project-overview";
import ProjectList from "./projects/project-list";
import TimesheetEntry from "./projects/timesheet-entry";
import TimesheetSummary from "./projects/timesheet-summary";

// Policies Agent UI Components
import PolicySearchResults from "./policies/policy-search-results";
import PolicyViewer from "./policies/policy-viewer";
import PolicyList from "./policies/policy-list";
import PolicyQA from "./policies/policy-qa";

const ComponentMap = {
  // Finance
  "expense-list": ExpenseList,
  "expense-form": ExpenseForm,
  "expense-approval": ExpenseApproval,
  "financial-dashboard": FinancialDashboard,

  // Operations
  "flight-search": FlightSearch,
  "hotel-search": HotelSearch,
  "booking-list": BookingList,
  "meeting-scheduler": MeetingScheduler,
  "meeting-list": MeetingList,

  // Projects
  "task-board": TaskBoard,
  "task-form": TaskForm,
  "project-overview": ProjectOverview,
  "project-list": ProjectList,
  "timesheet-entry": TimesheetEntry,
  "timesheet-summary": TimesheetSummary,

  // Policies
  "policy-search-results": PolicySearchResults,
  "policy-viewer": PolicyViewer,
  "policy-list": PolicyList,
  "policy-qa": PolicyQA,
} as const;

export default ComponentMap;
