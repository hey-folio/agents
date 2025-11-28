import "./index.css";
import { useState } from "react";

interface PolicySection {
  id: string;
  title: string;
  content: string;
}

interface Policy {
  id: string;
  title: string;
  category: string;
  summary: string;
  sections: PolicySection[];
  keywords: string[];
  effectiveDate: string;
  lastUpdated: string;
  version: string;
}

interface PolicyViewerProps {
  policy: Policy;
}

export default function PolicyViewer({ policy }: PolicyViewerProps) {
  const [activeSection, setActiveSection] = useState<string | null>(
    policy.sections.length > 0 ? policy.sections[0].id : null
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      expense: "bg-green-100 text-green-800",
      travel: "bg-blue-100 text-blue-800",
      time_off: "bg-purple-100 text-purple-800",
      remote_work: "bg-cyan-100 text-cyan-800",
      equipment: "bg-orange-100 text-orange-800",
      conduct: "bg-red-100 text-red-800",
      security: "bg-yellow-100 text-yellow-800",
      benefits: "bg-pink-100 text-pink-800",
      general: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.general;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-3xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white font-bold text-xl">{policy.title}</h2>
              <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(policy.category)}`}>
                {policy.category.replace("_", " ")}
              </span>
            </div>
            <p className="text-amber-100 text-sm">{policy.summary}</p>
          </div>
          <div className="text-right text-amber-100 text-xs">
            <p>Version {policy.version}</p>
            <p>Updated {formatDate(policy.lastUpdated)}</p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Section Navigation */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 p-3 flex-shrink-0">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Sections</p>
          <nav className="space-y-1">
            {policy.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? "bg-amber-100 text-amber-800 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Section Content */}
        <div className="flex-1 p-6 max-h-96 overflow-y-auto">
          {policy.sections.map((section) => (
            <div
              key={section.id}
              className={activeSection === section.id ? "block" : "hidden"}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                {section.title}
              </h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {policy.keywords.slice(0, 6).map((keyword) => (
              <span
                key={keyword}
                className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-xs rounded"
              >
                {keyword}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Effective from {formatDate(policy.effectiveDate)}
          </p>
        </div>
      </div>
    </div>
  );
}
