import "./index.css";
import { useState } from "react";

interface PolicySource {
  policyId: string;
  policyTitle: string;
  category: string;
  sections: {
    sectionTitle: string;
    content: string;
  }[];
}

interface PolicyQAProps {
  question: string;
  sources: PolicySource[];
  confidence: number;
}

export default function PolicyQA({ question, sources, confidence }: PolicyQAProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(
    sources.length > 0 ? sources[0].policyId : null
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

  const getConfidenceInfo = (conf: number) => {
    if (conf >= 80) return { label: "High", color: "bg-green-500" };
    if (conf >= 50) return { label: "Medium", color: "bg-yellow-500" };
    if (conf >= 20) return { label: "Low", color: "bg-orange-500" };
    return { label: "Very Low", color: "bg-red-500" };
  };

  const confidenceInfo = getConfidenceInfo(confidence);

  return (
    <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-white font-bold text-xl flex items-center mb-2">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Policy Q&A
            </h2>
            <p className="text-amber-100">{question}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 bg-amber-800/50 px-3 py-1 rounded-md">
              <div className={`w-2 h-2 rounded-full ${confidenceInfo.color}`} />
              <span className="text-white text-sm">{confidenceInfo.label} confidence</span>
            </div>
          </div>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p className="font-medium mb-1">No relevant policies found</p>
          <p className="text-sm">Try rephrasing your question or browsing policies by category</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          <div className="p-4 bg-amber-50 border-b border-amber-100">
            <p className="text-sm text-amber-800">
              <strong>{sources.length}</strong> polic{sources.length !== 1 ? "ies" : "y"} found with relevant information
            </p>
          </div>

          {sources.map((source, index) => (
            <div key={source.policyId} className="p-4">
              <div
                onClick={() => setExpandedSource(expandedSource === source.policyId ? null : source.policyId)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <h3 className="font-medium text-gray-900">{source.policyTitle}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(source.category)}`}>
                      {source.category.replace("_", " ")}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedSource === source.policyId ? "rotate-180" : ""}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {expandedSource === source.policyId && (
                <div className="mt-3 space-y-3">
                  {source.sections.map((section, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-gray-50 rounded-lg p-3 border-l-4 border-amber-400"
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        {section.sectionTitle}
                      </h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            These are excerpts from company policies. For complete information, refer to the full policy documents.
          </p>
        </div>
      )}
    </div>
  );
}
