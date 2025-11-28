import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  pricePerNight: number;
  totalPrice: number;
  amenities: string[];
  roomsAvailable: number;
}

interface HotelSearchProps {
  toolCallId: string;
  hotels: Hotel[];
  searchParams: {
    city: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
}

export default function HotelSearch({ toolCallId, hotels, searchParams }: HotelSearchProps) {
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const thread = useStreamContext();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleBook = () => {
    if (!selectedHotel) return;
    const hotel = hotels.find((h) => h.id === selectedHotel);
    if (!hotel) return;

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
                  message: `Booked ${hotel.name}`,
                  hotel,
                }),
              },
            ],
          },
        },
      }
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (booked) {
    const hotel = hotels.find((h) => h.id === selectedHotel);
    return (
      <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
        <div className="bg-gradient-to-r from-sky-700 to-sky-500 px-6 py-4">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Hotel Booked
          </h2>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium text-lg mb-2">{hotel?.name}</p>
          <p className="text-gray-500">
            {formatDate(searchParams.checkIn)} - {formatDate(searchParams.checkOut)}
          </p>
          <p className="text-sky-600 font-bold text-2xl mt-2">${hotel?.totalPrice}</p>
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
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
            Hotel Results
          </h2>
          <div className="bg-sky-800/50 text-white px-3 py-1 rounded-md text-sm">
            {searchParams.city} · {formatDate(searchParams.checkIn)} - {formatDate(searchParams.checkOut)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            onClick={() => setSelectedHotel(hotel.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedHotel === hotel.id
                ? "border-sky-500 bg-sky-50"
                : "border-gray-200 hover:border-sky-300"
            }`}
          >
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{hotel.name}</span>
                  <div className="flex">{renderStars(hotel.rating)}</div>
                </div>
                <p className="text-sm text-gray-500 mb-2">{hotel.address}</p>
                <div className="flex flex-wrap gap-1">
                  {hotel.amenities.slice(0, 4).map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-2xl font-bold text-sky-600">${hotel.totalPrice}</p>
                <p className="text-xs text-gray-500">${hotel.pricePerNight}/night</p>
                <p className="text-xs text-gray-400 mt-1">{hotel.roomsAvailable} rooms left</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedHotel && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleBook}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Book Selected Hotel
          </button>
        </div>
      )}
    </div>
  );
}
