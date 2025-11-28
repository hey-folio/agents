import "./index.css";
import { useState } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";

interface Meeting {
  id: string;
  title: string;
  organizerId: string;
  organizerName?: string;
  attendees: string[];
  attendeeNames?: string[];
  scheduledFor: string;
  duration: number;
  location?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

interface MeetingListProps {
  toolCallId?: string;
  meetings: Meeting[];
  allowCancel?: boolean;
}

export default function MeetingList({ toolCallId, meetings, allowCancel = false }: MeetingListProps) {
  const [cancelledMeetings, setCancelledMeetings] = useState<Set<string>>(new Set());
  const thread = useStreamContext();

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCancel = (meeting: Meeting) => {
    if (!toolCallId) return;

    setCancelledMeetings((prev) => new Set(prev).add(meeting.id));

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
                  message: `Cancelled meeting: ${meeting.title}`,
                  meetingId: meeting.id,
                }),
              },
            ],
          },
        },
      }
    );
  };

  const isUpcoming = (scheduledFor: string) => {
    return new Date(scheduledFor) > new Date();
  };

  // Group meetings by date
  const groupedMeetings = meetings.reduce<Record<string, Meeting[]>>((acc, meeting) => {
    const dateKey = new Date(meeting.scheduledFor).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(meeting);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedMeetings).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Meetings
          </h2>
          <div className="bg-teal-800/50 text-white px-3 py-1 rounded-md text-sm">
            {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {meetings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            No meetings scheduled
          </div>
        ) : (
          sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                <span className="text-sm font-medium text-gray-600">
                  {new Date(dateKey).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {groupedMeetings[dateKey].map((meeting) => {
                  const { time } = formatDateTime(meeting.scheduledFor);
                  const isCancelled = cancelledMeetings.has(meeting.id) || meeting.status === "cancelled";
                  const canCancel = allowCancel && isUpcoming(meeting.scheduledFor) && !isCancelled;

                  return (
                    <div
                      key={meeting.id}
                      className={`p-4 ${isCancelled ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold text-teal-600">{time}</p>
                          <p className="text-xs text-gray-500">{formatDuration(meeting.duration)}</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{meeting.title}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(meeting.status)}`}>
                              {isCancelled ? "cancelled" : meeting.status.replace("_", " ")}
                            </span>
                          </div>
                          {meeting.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {meeting.location}
                            </p>
                          )}
                          {meeting.attendeeNames && meeting.attendeeNames.length > 0 && (
                            <p className="text-sm text-gray-400">
                              {meeting.attendeeNames.slice(0, 3).join(", ")}
                              {meeting.attendeeNames.length > 3 && ` +${meeting.attendeeNames.length - 3} more`}
                            </p>
                          )}
                        </div>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(meeting)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
