import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: { airport: string; city: string; time: string };
  arrival: { airport: string; city: string; time: string };
  price: number;
  class: string;
  duration: string;
  stops: number;
  seatsAvailable: number;
}

interface FlightSearchProps {
  toolCallId: string;
  flights: Flight[];
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
  };
}

export default function FlightSearch({ toolCallId, flights, searchParams }: FlightSearchProps) {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const thread = useStreamContext();

  const formatTime = (isoTime: string) => {
    return new Date(isoTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleBook = () => {
    if (!selectedFlight) return;
    const flight = flights.find((f) => f.id === selectedFlight);
    if (!flight) return;

    setBooked(true);

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
                  message: `Booked ${flight.airline} ${flight.flightNumber}`,
                  flight,
                }),
              },
            ],
          },
        },
      }
    );
  };

  if (booked) {
    const flight = flights.find((f) => f.id === selectedFlight);
    return (
      <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
        <div className="bg-gradient-to-r from-sky-700 to-sky-500 px-6 py-4">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Flight Booked
          </h2>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium text-lg mb-2">
            {flight?.airline} {flight?.flightNumber}
          </p>
          <p className="text-gray-500">
            {searchParams.origin} → {searchParams.destination}
          </p>
          <p className="text-sky-600 font-bold text-2xl mt-2">${flight?.price}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-sky-700 to-sky-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            Flight Results
          </h2>
          <div className="bg-sky-800/50 text-white px-3 py-1 rounded-md text-sm">
            {searchParams.origin} → {searchParams.destination} · {formatDate(searchParams.departureDate)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {flights.map((flight) => (
          <div
            key={flight.id}
            onClick={() => setSelectedFlight(flight.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedFlight === flight.id
                ? "border-sky-500 bg-sky-50"
                : "border-gray-200 hover:border-sky-300"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">{flight.airline}</span>
                  <span className="text-gray-400 text-sm">{flight.flightNumber}</span>
                  {flight.stops === 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Nonstop</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="font-bold text-lg">{formatTime(flight.departure.time)}</p>
                    <p className="text-gray-500">{flight.departure.airport}</p>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="h-px bg-gray-300 flex-1" />
                    <span className="px-2 text-gray-400 text-xs">{flight.duration}</span>
                    <div className="h-px bg-gray-300 flex-1" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatTime(flight.arrival.time)}</p>
                    <p className="text-gray-500">{flight.arrival.airport}</p>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-2xl font-bold text-sky-600">${flight.price}</p>
                <p className="text-xs text-gray-500">{flight.seatsAvailable} seats left</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedFlight && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleBook}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Book Selected Flight
          </button>
        </div>
      )}
    </div>
  );
}
