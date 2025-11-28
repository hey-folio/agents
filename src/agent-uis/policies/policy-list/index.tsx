import "./index.css";
import { ReactNode } from "react";

interface Policy {
  id: string;
  title: string;
  category: string;
  summary: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
}

interface PolicyListProps {
  category: string;
  policies: Policy[];
}

export default function PolicyList({ category, policies }: PolicyListProps) {
  const getCategoryInfo = (cat: string) => {
    const info: Record<string, { icon: ReactNode; color: string; bgColor: string }> = {
      expense: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        ),
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      travel: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        ),
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      time_off: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        ),
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      remote_work: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
          </svg>
        ),
        color: "text-cyan-600",
        bgColor: "bg-cyan-100",
      },
      equipment: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
          </svg>
        ),
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      },
      conduct: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ),
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
      security: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      },
      benefits: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        ),
        color: "text-pink-600",
        bgColor: "bg-pink-100",
      },
      general: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        ),
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      },
    };
    return info[cat] || info.general;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const categoryInfo = getCategoryInfo(category);
  const categoryLabel = category.replace("_", " ").charAt(0).toUpperCase() + category.replace("_", " ").slice(1);

  return (
    <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl flex items-center">
            <div className={`${categoryInfo.bgColor} ${categoryInfo.color} p-1.5 rounded-lg mr-2`}>
              {categoryInfo.icon}
            </div>
            {categoryLabel} Policies
          </h2>
          <div className="bg-amber-800/50 text-white px-3 py-1 rounded-md text-sm">
            {policies.length} polic{policies.length !== 1 ? "ies" : "y"}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {policies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            No policies in this category
          </div>
        ) : (
          policies.map((policy) => (
            <div key={policy.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{policy.title}</h3>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">v{policy.version}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{policy.summary}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Effective {formatDate(policy.effectiveDate)}
                </span>
                <span>Updated {formatDate(policy.lastUpdated)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
