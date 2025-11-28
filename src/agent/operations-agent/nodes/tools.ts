import { OperationsState, OperationsUpdate } from "../types";
import { ChatAnthropic } from "@langchain/anthropic";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import type ComponentMap from "../../../agent-uis/index";
import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { findToolCall } from "../../find-tool-call";
import { jsonStore } from "../../operations-team/utils/json-store";
import { Employee } from "../../operations-team/types";
import {
  TravelBooking,
  Meeting,
  FlightSearchResult,
  HotelSearchResult,
  MeetingTypeSchema,
} from "../../operations-team/types";

// Tool schemas
const searchFlightsSchema = z.object({
  origin: z.string().describe("Departure city or airport code (e.g., 'SFO' or 'San Francisco')"),
  destination: z.string().describe("Arrival city or airport code"),
  departureDate: z.string().describe("Departure date (YYYY-MM-DD format)"),
  returnDate: z.string().optional().describe("Return date for round trips"),
  passengers: z.number().default(1).describe("Number of passengers"),
});

const searchHotelsSchema = z.object({
  city: z.string().describe("Destination city"),
  checkIn: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOut: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().default(1).describe("Number of guests"),
});

const bookTravelSchema = z.object({
  type: z.enum(["flight", "hotel", "car"]).describe("Type of booking"),
  itemId: z.string().describe("ID of the flight/hotel/car to book"),
  projectId: z.string().optional().describe("Associated project ID"),
});

const listBookingsSchema = z.object({
  type: z.enum(["flight", "hotel", "car", "all"]).optional().describe("Filter by booking type"),
  status: z.enum(["pending", "confirmed", "cancelled"]).optional().describe("Filter by status"),
});

const scheduleMeetingSchema = z.object({
  title: z.string().describe("Meeting title"),
  type: MeetingTypeSchema.describe("Meeting type (client, supplier, internal, interview)"),
  attendees: z.array(z.object({
    email: z.string(),
    name: z.string(),
  })).describe("List of attendees with name and email"),
  startTime: z.string().describe("Meeting start time (ISO format)"),
  duration: z.number().describe("Duration in minutes"),
  location: z.string().optional().describe("Physical location or 'virtual'"),
  agenda: z.string().optional().describe("Meeting agenda"),
  projectId: z.string().optional().describe("Associated project ID"),
});

const listMeetingsSchema = z.object({
  startDate: z.string().optional().describe("Filter from date"),
  endDate: z.string().optional().describe("Filter to date"),
  type: MeetingTypeSchema.optional().describe("Filter by meeting type"),
});

const cancelMeetingSchema = z.object({
  meetingId: z.string().describe("ID of meeting to cancel"),
  reason: z.string().optional().describe("Cancellation reason"),
});

const OPERATIONS_TOOLS = [
  {
    name: "search-flights",
    description: "Search for available flights. Use when someone wants to find or look for flights.",
    schema: searchFlightsSchema,
  },
  {
    name: "search-hotels",
    description: "Search for available hotels. Use when someone wants to find accommodation or hotels.",
    schema: searchHotelsSchema,
  },
  {
    name: "book-travel",
    description: "Book a flight, hotel, or car rental. Use after user has selected an option from search results.",
    schema: bookTravelSchema,
  },
  {
    name: "list-bookings",
    description: "List travel bookings. Use to show existing or upcoming travel bookings.",
    schema: listBookingsSchema,
  },
  {
    name: "schedule-meeting",
    description: "Schedule a new meeting with attendees. Use when someone wants to set up, schedule, or create a meeting.",
    schema: scheduleMeetingSchema,
  },
  {
    name: "list-meetings",
    description: "List scheduled meetings. Use to show upcoming meetings or meeting schedule.",
    schema: listMeetingsSchema,
  },
  {
    name: "cancel-meeting",
    description: "Cancel a scheduled meeting.",
    schema: cancelMeetingSchema,
  },
];

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  temperature: 0,
});

// Mock flight search results generator
function generateFlightResults(origin: string, destination: string, date: string): FlightSearchResult[] {
  const airlines = ["United Airlines", "Delta Airlines", "American Airlines", "JetBlue", "Southwest"];
  const results: FlightSearchResult[] = [];

  for (let i = 0; i < 5; i++) {
    const airline = airlines[i % airlines.length];
    const departHour = 6 + i * 3;
    const duration = 2 + Math.floor(Math.random() * 4);

    results.push({
      id: `flight-${Date.now()}-${i}`,
      airline,
      flightNumber: `${airline.substring(0, 2).toUpperCase()}${1000 + Math.floor(Math.random() * 9000)}`,
      departure: {
        airport: origin.toUpperCase().substring(0, 3),
        city: origin,
        time: `${date}T${departHour.toString().padStart(2, "0")}:00:00Z`,
      },
      arrival: {
        airport: destination.toUpperCase().substring(0, 3),
        city: destination,
        time: `${date}T${(departHour + duration).toString().padStart(2, "0")}:30:00Z`,
      },
      price: 200 + Math.floor(Math.random() * 400),
      class: "economy",
      duration: `${duration}h 30m`,
      stops: i % 3 === 0 ? 1 : 0,
      seatsAvailable: 5 + Math.floor(Math.random() * 50),
    });
  }

  return results;
}

// Mock hotel search results generator
function generateHotelResults(city: string, checkIn: string, checkOut: string): HotelSearchResult[] {
  const hotels = [
    { name: "Grand Hotel", rating: 5 },
    { name: "City Center Inn", rating: 3 },
    { name: "Business Suites", rating: 4 },
    { name: "Comfort Lodge", rating: 3 },
    { name: "Luxury Plaza", rating: 5 },
  ];

  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  return hotels.map((hotel, i) => ({
    id: `hotel-${Date.now()}-${i}`,
    name: `${city} ${hotel.name}`,
    address: `${100 + i * 50} Main Street`,
    city,
    rating: hotel.rating,
    pricePerNight: 100 + hotel.rating * 50 + Math.floor(Math.random() * 100),
    totalPrice: (100 + hotel.rating * 50 + Math.floor(Math.random() * 100)) * nights,
    amenities: ["WiFi", "Gym", hotel.rating >= 4 ? "Pool" : "Parking", hotel.rating >= 4 ? "Spa" : "Restaurant"],
    imageUrl: `https://images.unsplash.com/photo-${1566073771259 + i}-6a8506099945`,
    roomsAvailable: 1 + Math.floor(Math.random() * 10),
  }));
}

export async function callOperationsTools(
  state: OperationsState,
  config: LangGraphRunnableConfig
): Promise<OperationsUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);

  const message = await llm.bindTools(OPERATIONS_TOOLS).invoke([
    {
      role: "system",
      content: `You are an operations assistant for a digital design agency. You help with:
- Searching and booking travel (flights, hotels, car rentals)
- Scheduling and managing meetings with clients and suppliers
- Viewing travel itineraries and meeting schedules

Be helpful and concise. The current user is "emp-003" (Emily Rodriguez) unless specified otherwise.
Today's date is ${new Date().toISOString().split("T")[0]}.`,
    },
    ...state.messages,
  ]);

  // Handle search-flights
  const searchFlightsCall = message.tool_calls?.find(
    findToolCall("search-flights")<typeof searchFlightsSchema>
  );

  if (searchFlightsCall) {
    const flights = generateFlightResults(
      searchFlightsCall.args.origin,
      searchFlightsCall.args.destination,
      searchFlightsCall.args.departureDate
    );

    ui.push(
      {
        name: "flight-search",
        props: {
          toolCallId: searchFlightsCall.id ?? "",
          flights,
          searchParams: searchFlightsCall.args,
        },
      },
      { message }
    );
  }

  // Handle search-hotels
  const searchHotelsCall = message.tool_calls?.find(
    findToolCall("search-hotels")<typeof searchHotelsSchema>
  );

  if (searchHotelsCall) {
    const hotels = generateHotelResults(
      searchHotelsCall.args.city,
      searchHotelsCall.args.checkIn,
      searchHotelsCall.args.checkOut
    );

    ui.push(
      {
        name: "hotel-search",
        props: {
          toolCallId: searchHotelsCall.id ?? "",
          hotels,
          searchParams: searchHotelsCall.args,
        },
      },
      { message }
    );
  }

  // Handle list-bookings
  const listBookingsCall = message.tool_calls?.find(
    findToolCall("list-bookings")<typeof listBookingsSchema>
  );

  if (listBookingsCall) {
    let bookings = jsonStore.read<TravelBooking>("travel-bookings");

    if (listBookingsCall.args.type && listBookingsCall.args.type !== "all") {
      bookings = bookings.filter((b) => b.type === listBookingsCall.args.type);
    }
    if (listBookingsCall.args.status) {
      bookings = bookings.filter((b) => b.status === listBookingsCall.args.status);
    }

    // Map TravelBooking to the format expected by the UI component
    const mappedBookings = bookings.map((b) => ({
      id: b.id,
      type: b.type,
      employeeId: b.employeeId,
      employeeName: b.employeeName,
      status: b.status,
      details: {
        origin: b.flightDetails?.departure?.city,
        destination: b.flightDetails?.arrival?.city,
        departureDate: b.flightDetails?.departure?.time || b.hotelDetails?.checkIn,
        returnDate: b.flightDetails?.arrival?.time,
        airline: b.flightDetails?.airline,
        flightNumber: b.flightDetails?.flightNumber,
        hotelName: b.hotelDetails?.name,
        checkIn: b.hotelDetails?.checkIn,
        checkOut: b.hotelDetails?.checkOut,
      },
      cost: b.totalCost,
      bookedAt: b.createdAt,
      purpose: b.projectName || "Business Travel",
    }));

    ui.push(
      {
        name: "booking-list",
        props: {
          bookings: mappedBookings,
          filter: listBookingsCall.args.type ? { type: listBookingsCall.args.type === "all" ? undefined : listBookingsCall.args.type, status: listBookingsCall.args.status } : undefined,
        },
      },
      { message }
    );
  }

  // Handle schedule-meeting
  const scheduleMeetingCall = message.tool_calls?.find(
    findToolCall("schedule-meeting")<typeof scheduleMeetingSchema>
  );

  if (scheduleMeetingCall) {
    // Get available employees for attendee selection
    const employees = jsonStore.read<Employee>("employees");
    const availableAttendees = employees.map((e) => ({
      id: e.id,
      name: e.name,
    }));

    ui.push(
      {
        name: "meeting-scheduler",
        props: {
          toolCallId: scheduleMeetingCall.id ?? "",
          suggestedTime: scheduleMeetingCall.args.startTime,
          suggestedDuration: scheduleMeetingCall.args.duration,
          suggestedTitle: scheduleMeetingCall.args.title,
          availableAttendees,
        },
      },
      { message }
    );
  }

  // Handle list-meetings
  const listMeetingsCall = message.tool_calls?.find(
    findToolCall("list-meetings")<typeof listMeetingsSchema>
  );

  if (listMeetingsCall) {
    let meetings = jsonStore.read<Meeting>("meetings");

    if (listMeetingsCall.args.type) {
      meetings = meetings.filter((m) => m.type === listMeetingsCall.args.type);
    }
    if (listMeetingsCall.args.startDate) {
      meetings = meetings.filter((m) => m.startTime >= listMeetingsCall.args.startDate!);
    }
    if (listMeetingsCall.args.endDate) {
      meetings = meetings.filter((m) => m.startTime <= listMeetingsCall.args.endDate!);
    }

    // Sort by start time
    meetings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Calculate duration in minutes from start/end time
    const calcDuration = (start: string, end: string): number => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    };

    // Map to the format expected by the UI component
    const mappedMeetings = meetings.map((m) => ({
      id: m.id,
      title: m.title,
      organizerId: m.createdBy,
      organizerName: m.createdByName,
      attendees: m.attendees.map((a) => a.id),
      attendeeNames: m.attendees.map((a) => a.name),
      scheduledFor: m.startTime,
      duration: calcDuration(m.startTime, m.endTime),
      location: m.location,
      status: m.status,
      notes: m.notes,
    }));

    ui.push(
      {
        name: "meeting-list",
        props: {
          meetings: mappedMeetings,
          allowCancel: true,
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
