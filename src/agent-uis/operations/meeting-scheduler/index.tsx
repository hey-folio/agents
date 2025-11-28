import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface Employee {
  id: string;
  name: string;
}

interface MeetingSchedulerProps {
  toolCallId: string;
  suggestedTime?: string;
  suggestedDuration?: number;
  suggestedTitle?: string;
  availableAttendees: Employee[];
}

export default function MeetingScheduler({
  toolCallId,
  suggestedTime,
  suggestedDuration = 60,
  suggestedTitle = "",
  availableAttendees,
}: MeetingSchedulerProps) {
  const [title, setTitle] = useState(suggestedTitle);
  const [date, setDate] = useState(suggestedTime?.split("T")[0] || "");
  const [time, setTime] = useState(suggestedTime?.split("T")[1]?.slice(0, 5) || "09:00");
  const [duration, setDuration] = useState(suggestedDuration);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const thread = useStreamContext();

  const toggleAttendee = (id: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSchedule = () => {
    if (!title.trim() || !date || selectedAttendees.length === 0) return;

    const meetingData = {
      title,
      scheduledFor: `${date}T${time}:00`,
      duration,
      attendees: selectedAttendees,
      location: location || undefined,
    };

    setIsScheduled(true);

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
                  message: `Scheduled "${title}" for ${date} at ${time}`,
                  meeting: meetingData,
                }),
              },
            ],
          },
        },
      }
    );
  };

  if (isScheduled) {
    return (
      <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
        <div className="bg-gradient-to-r from-teal-700 to-teal-500 px-6 py-4">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Meeting Scheduled
          </h2>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium text-lg mb-2">{title}</p>
          <p className="text-gray-500">{date} at {time}</p>
          <p className="text-teal-600 font-medium mt-2">
            {selectedAttendees.length} attendee{selectedAttendees.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 px-6 py-4">
        <h2 className="text-white font-bold text-xl flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Schedule Meeting
        </h2>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Project Kickoff"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Conference Room A or Zoom"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attendees ({selectedAttendees.length} selected)
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {availableAttendees.map((employee) => (
              <div
                key={employee.id}
                onClick={() => toggleAttendee(employee.id)}
                className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between ${
                  selectedAttendees.includes(employee.id)
                    ? "bg-teal-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="text-sm text-gray-900">{employee.name}</span>
                {selectedAttendees.includes(employee.id) && (
                  <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSchedule}
          disabled={!title.trim() || !date || selectedAttendees.length === 0}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Schedule Meeting
        </button>
      </div>
    </div>
  );
}
