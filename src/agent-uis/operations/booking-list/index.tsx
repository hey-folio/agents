import "./index.css";
import { useState } from "react";

interface TravelBooking {
  id: string;
  type: "flight" | "hotel" | "car";
  employeeId: string;
  employeeName?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  details: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    airline?: string;
    flightNumber?: string;
    hotelName?: string;
    checkIn?: string;
    checkOut?: string;
    carCompany?: string;
    pickupDate?: string;
    dropoffDate?: string;
  };
  cost: number;
  bookedAt: string;
  purpose: string;
}

interface BookingListProps {
  bookings: TravelBooking[];
  filter?: {
    type?: "flight" | "hotel" | "car";
    status?: string;
    employeeId?: string;
  };
}

export default function BookingList({ bookings, filter }: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<TravelBooking | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "flight":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        );
      case "hotel":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
          </svg>
        );
      case "car":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a2.5 2.5 0 014.9 0H17a1 1 0 001-1v-3a1 1 0 00-.293-.707l-2-2A1 1 0 0015 9h-1V5a1 1 0 00-1-1H3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBookingDescription = (booking: TravelBooking) => {
    const d = booking.details;
    switch (booking.type) {
      case "flight":
        return `${d.origin} → ${d.destination}`;
      case "hotel":
        return d.hotelName || "Hotel Booking";
      case "car":
        return d.carCompany || "Car Rental";
      default:
        return "Booking";
    }
  };

  const getBookingDates = (booking: TravelBooking) => {
    const d = booking.details;
    switch (booking.type) {
      case "flight":
        return d.returnDate
          ? `${formatDate(d.departureDate!)} - ${formatDate(d.returnDate)}`
          : formatDate(d.departureDate!);
      case "hotel":
        return `${formatDate(d.checkIn!)} - ${formatDate(d.checkOut!)}`;
      case "car":
        return `${formatDate(d.pickupDate!)} - ${formatDate(d.dropoffDate!)}`;
      default:
        return "";
    }
  };

  const filterLabel = filter?.type
    ? `${filter.type.charAt(0).toUpperCase() + filter.type.slice(1)} Bookings`
    : filter?.status
      ? `${filter.status.charAt(0).toUpperCase() + filter.status.slice(1)} Bookings`
      : "Travel Bookings";

  return (
    <div className="w-full max-w-3xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {filterLabel}
          </h2>
          <div className="bg-indigo-800/50 text-white px-3 py-1 rounded-md text-sm">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            No bookings found
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  booking.type === "flight" ? "bg-sky-100 text-sky-600" :
                  booking.type === "hotel" ? "bg-purple-100 text-purple-600" :
                  "bg-orange-100 text-orange-600"
                }`}>
                  {getTypeIcon(booking.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{getBookingDescription(booking)}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{getBookingDates(booking)}</p>
                  {booking.employeeName && (
                    <p className="text-sm text-gray-400 mt-1">{booking.employeeName}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">${booking.cost.toLocaleString()}</p>
                </div>
              </div>

              {selectedBooking?.id === booking.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Purpose:</span>
                      <p className="text-gray-900">{booking.purpose}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Booked:</span>
                      <p className="text-gray-900">{formatDate(booking.bookedAt)}</p>
                    </div>
                    {booking.type === "flight" && booking.details.airline && (
                      <div>
                        <span className="text-gray-500">Airline:</span>
                        <p className="text-gray-900">{booking.details.airline} {booking.details.flightNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
