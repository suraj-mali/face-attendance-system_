import React, { useMemo } from "react";

export interface AttendanceRecord {
  student_id: string;
  name: string;
  roll_number: string;
  is_present: boolean;
  confidence_score?: number | null;
  marked_at?: string;
  marked_by?: string;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showConfidence?: boolean;
}

export default function AttendanceTable({
  records,
  showConfidence = true,
}: AttendanceTableProps) {
  
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      // Present first
      if (a.is_present && !b.is_present) return -1;
      if (!a.is_present && b.is_present) return 1;
      
      // Then alphabetically by roll number
      return a.roll_number.localeCompare(b.roll_number);
    });
  }, [records]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getMethodDisplay = (markedBy?: string) => {
    if (!markedBy) return "—";
    const lower = markedBy.toLowerCase();
    if (lower.includes("face") || lower.includes("ai") || lower === "insightface") {
      return (
        <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Face AI
        </span>
      );
    }
    if (lower === "system" || lower === "auto") {
      return (
        <span className="inline-flex items-center text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Auto
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Manual
      </span>
    );
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-24">
                Roll No
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">
                Status
              </th>
              {showConfidence && (
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">
                  Confidence
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">
                Marked At
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-32">
                Method
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 text-sm">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={showConfidence ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No records found.</p>
                </td>
              </tr>
            ) : (
              sortedRecords.map((record, index) => (
                <tr 
                  key={record.student_id || index} 
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50 hover:bg-gray-50"}
                >
                  <td className="px-6 py-3 whitespace-nowrap font-mono text-gray-600 border-l-4 border-transparent">
                    {record.roll_number}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900">
                    {record.name}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-center">
                    {record.is_present ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                        Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        Absent
                      </span>
                    )}
                  </td>
                  {showConfidence && (
                    <td className="px-6 py-3 whitespace-nowrap text-center text-gray-600">
                      {record.confidence_score != null ? (
                         <span className={record.confidence_score >= 0.8 ? "text-green-600 font-medium" : "text-orange-500 font-medium"}>
                            {(record.confidence_score * 100).toFixed(1)}%
                         </span>
                      ) : "—"}
                    </td>
                  )}
                  <td className="px-6 py-3 whitespace-nowrap text-center text-gray-500 font-mono text-xs">
                    {formatTime(record.marked_at)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    {getMethodDisplay(record.marked_by)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
