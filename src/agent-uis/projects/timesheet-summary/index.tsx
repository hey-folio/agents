import "./index.css";

interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName?: string;
  projectId: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  date: string;
  hours: number;
  description?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
}

interface ProjectHours {
  projectId: string;
  projectName: string;
  hours: number;
  percentage: number;
}

interface TimesheetSummaryProps {
  entries: TimesheetEntry[];
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  projectBreakdown: ProjectHours[];
  employeeName?: string;
}

export default function TimesheetSummary({
  entries,
  periodStart,
  periodEnd,
  totalHours,
  projectBreakdown,
  employeeName,
}: TimesheetSummaryProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "draft":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const projectColors = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
  ];

  // Group entries by date
  const entriesByDate = entries.reduce<Record<string, TimesheetEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(entriesByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-white font-bold text-xl flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Timesheet Summary
            </h2>
            {employeeName && <p className="text-emerald-100 text-sm mt-1">{employeeName}</p>}
          </div>
          <div className="text-right">
            <p className="text-white text-2xl font-bold">{totalHours}h</p>
            <p className="text-emerald-100 text-sm">{formatPeriod(periodStart, periodEnd)}</p>
          </div>
        </div>
      </div>

      {/* Project Breakdown */}
      {projectBreakdown.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Hours by Project</h3>

          {/* Stacked bar */}
          <div className="h-3 rounded-full overflow-hidden flex mb-3">
            {projectBreakdown.map((project, i) => (
              <div
                key={project.projectId}
                className={`${projectColors[i % projectColors.length]} transition-all`}
                style={{ width: `${project.percentage}%` }}
                title={`${project.projectName}: ${project.hours}h`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {projectBreakdown.map((project, i) => (
              <div key={project.projectId} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${projectColors[i % projectColors.length]}`} />
                <span className="text-gray-600">{project.projectName}</span>
                <span className="text-gray-400">{project.hours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries by Date */}
      <div className="max-h-80 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            No time entries for this period
          </div>
        ) : (
          sortedDates.map((date) => {
            const dayEntries = entriesByDate[date];
            const dayTotal = dayEntries.reduce((sum, e) => sum + e.hours, 0);

            return (
              <div key={date}>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center sticky top-0">
                  <span className="text-sm font-medium text-gray-600">{formatDate(date)}</span>
                  <span className="text-sm font-bold text-gray-700">{dayTotal}h</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{entry.projectName}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(entry.status)}`}>
                              {entry.status}
                            </span>
                          </div>
                          {entry.taskName && (
                            <p className="text-sm text-gray-500">{entry.taskName}</p>
                          )}
                          {entry.description && (
                            <p className="text-sm text-gray-400 mt-1">{entry.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-emerald-600">{entry.hours}h</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
