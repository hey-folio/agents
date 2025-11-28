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
  relevantSections?: string[];
}

interface PolicySearchResultsProps {
  query: string;
  results: Policy[];
}

export default function PolicySearchResults({ query, results }: PolicySearchResultsProps) {
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Policy Search Results
          </h2>
          <div className="bg-amber-800/50 text-white px-3 py-1 rounded-md text-sm">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
        </div>
        <p className="text-amber-100 text-sm mt-2">
          Searching for: &quot;{query}&quot;
        </p>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {results.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            No policies found matching your search
          </div>
        ) : (
          results.map((policy) => (
            <div key={policy.id} className="p-4">
              <div
                onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{policy.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(policy.category)}`}>
                      {policy.category.replace("_", " ")}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedPolicy === policy.id ? "rotate-180" : ""}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-2">{policy.summary}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Updated {formatDate(policy.lastUpdated)}</span>
                  {policy.relevantSections && policy.relevantSections.length > 0 && (
                    <span className="text-amber-600">
                      {policy.relevantSections.length} relevant section{policy.relevantSections.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {expandedPolicy === policy.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {policy.relevantSections && policy.relevantSections.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-gray-500 uppercase">Relevant Sections</p>
                      {policy.sections
                        .filter((s) => policy.relevantSections?.includes(s.id))
                        .map((section) => (
                          <div key={section.id} className="bg-amber-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 text-sm mb-1">{section.title}</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-line">
                              {section.content.length > 300
                                ? `${section.content.slice(0, 300)}...`
                                : section.content}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {policy.sections.slice(0, 2).map((section) => (
                        <div key={section.id} className="bg-gray-50 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{section.title}</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-line">
                            {section.content.length > 200
                              ? `${section.content.slice(0, 200)}...`
                              : section.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {policy.keywords.slice(0, 5).map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
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
