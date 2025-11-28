import { z } from "zod";

// ===== EMPLOYEE SCHEMAS =====
export const EmployeeRoleSchema = z.enum([
  "designer",
  "developer",
  "project_manager",
  "account_manager",
  "creative_director",
  "copywriter",
  "ux_researcher",
  "administrator",
]);

export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: EmployeeRoleSchema,
  department: z.string(),
  hireDate: z.string(),
  managerId: z.string().optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

// ===== EXPENSE SCHEMAS =====
export const ExpenseStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
  "paid",
]);

export const ExpenseCategorySchema = z.enum([
  "travel",
  "meals",
  "software",
  "equipment",
  "client_entertainment",
  "office_supplies",
  "professional_development",
  "other",
]);

export const ExpenseSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  date: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  category: ExpenseCategorySchema,
  description: z.string(),
  receiptUrl: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  status: ExpenseStatusSchema,
  submittedAt: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedByName: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

// ===== TRAVEL SCHEMAS =====
export const FlightClassSchema = z.enum(["economy", "business", "first"]);

export const FlightDetailsSchema = z.object({
  airline: z.string(),
  flightNumber: z.string(),
  departure: z.object({
    airport: z.string(),
    city: z.string(),
    time: z.string(),
  }),
  arrival: z.object({
    airport: z.string(),
    city: z.string(),
    time: z.string(),
  }),
  class: FlightClassSchema,
  duration: z.string(),
  stops: z.number(),
});

export type FlightDetails = z.infer<typeof FlightDetailsSchema>;

export const HotelDetailsSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  rating: z.number().min(1).max(5),
  checkIn: z.string(),
  checkOut: z.string(),
  roomType: z.string(),
  amenities: z.array(z.string()),
  imageUrl: z.string().optional(),
});

export type HotelDetails = z.infer<typeof HotelDetailsSchema>;

export const VehicleTypeSchema = z.enum([
  "economy",
  "compact",
  "midsize",
  "suv",
  "luxury",
]);

export const CarDetailsSchema = z.object({
  company: z.string(),
  vehicleType: VehicleTypeSchema,
  model: z.string(),
  pickupLocation: z.string(),
  dropoffLocation: z.string(),
  pickupTime: z.string(),
  dropoffTime: z.string(),
  features: z.array(z.string()),
});

export type CarDetails = z.infer<typeof CarDetailsSchema>;

export const TravelBookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
]);

export const TravelBookingTypeSchema = z.enum(["flight", "hotel", "car"]);

export const TravelBookingSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  type: TravelBookingTypeSchema,
  status: TravelBookingStatusSchema,
  flightDetails: FlightDetailsSchema.optional(),
  hotelDetails: HotelDetailsSchema.optional(),
  carDetails: CarDetailsSchema.optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  totalCost: z.number(),
  confirmationNumber: z.string().optional(),
  bookedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TravelBooking = z.infer<typeof TravelBookingSchema>;

// ===== MEETING SCHEMAS =====
export const MeetingTypeSchema = z.enum([
  "client",
  "supplier",
  "internal",
  "interview",
]);

export const MeetingStatusSchema = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const AttendeeRoleSchema = z.enum(["organizer", "required", "optional"]);

export const AttendeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: AttendeeRoleSchema,
  responseStatus: z.enum(["accepted", "declined", "tentative", "pending"]),
});

export type Attendee = z.infer<typeof AttendeeSchema>;

export const MeetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: MeetingTypeSchema,
  attendees: z.array(AttendeeSchema),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  agenda: z.string().optional(),
  notes: z.string().optional(),
  status: MeetingStatusSchema,
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  createdBy: z.string(),
  createdByName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Meeting = z.infer<typeof MeetingSchema>;

// ===== PROJECT SCHEMAS =====
export const ProjectStatusSchema = z.enum([
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

export const TeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  allocation: z.number().min(0).max(100),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  status: ProjectStatusSchema,
  startDate: z.string(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  spent: z.number().default(0),
  teamMembers: z.array(TeamMemberSchema),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

// ===== TASK SCHEMAS =====
export const TaskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
]);

export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  projectId: z.string(),
  projectName: z.string(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

// ===== TIMESHEET SCHEMAS =====
export const TimesheetStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

export const TimesheetEntrySchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  date: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  taskId: z.string().optional(),
  taskName: z.string().optional(),
  hours: z.number().positive().max(24),
  description: z.string().optional(),
  billable: z.boolean(),
  status: TimesheetStatusSchema,
  submittedAt: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedByName: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TimesheetEntry = z.infer<typeof TimesheetEntrySchema>;

// ===== POLICY SCHEMAS =====
export const PolicyCategorySchema = z.enum([
  "expense",
  "travel",
  "time_off",
  "remote_work",
  "equipment",
  "conduct",
  "security",
  "benefits",
  "general",
]);

export const PolicySectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

export const PolicySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: PolicyCategorySchema,
  summary: z.string(),
  sections: z.array(PolicySectionSchema),
  effectiveDate: z.string(),
  lastUpdated: z.string(),
  version: z.string(),
  approvedBy: z.string(),
  keywords: z.array(z.string()),
});

export type Policy = z.infer<typeof PolicySchema>;
export type PolicySection = z.infer<typeof PolicySectionSchema>;

// ===== SEARCH RESULT SCHEMAS (for travel) =====
export const FlightSearchResultSchema = z.object({
  id: z.string(),
  airline: z.string(),
  flightNumber: z.string(),
  departure: z.object({
    airport: z.string(),
    city: z.string(),
    time: z.string(),
  }),
  arrival: z.object({
    airport: z.string(),
    city: z.string(),
    time: z.string(),
  }),
  price: z.number(),
  class: FlightClassSchema,
  duration: z.string(),
  stops: z.number(),
  seatsAvailable: z.number(),
});

export type FlightSearchResult = z.infer<typeof FlightSearchResultSchema>;

export const HotelSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  rating: z.number().min(1).max(5),
  pricePerNight: z.number(),
  totalPrice: z.number(),
  amenities: z.array(z.string()),
  imageUrl: z.string(),
  roomsAvailable: z.number(),
});

export type HotelSearchResult = z.infer<typeof HotelSearchResultSchema>;

export const CarSearchResultSchema = z.object({
  id: z.string(),
  company: z.string(),
  vehicleType: VehicleTypeSchema,
  model: z.string(),
  pricePerDay: z.number(),
  totalPrice: z.number(),
  features: z.array(z.string()),
  imageUrl: z.string(),
  available: z.boolean(),
});

export type CarSearchResult = z.infer<typeof CarSearchResultSchema>;
