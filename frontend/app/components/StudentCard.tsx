import React from "react";

interface StudentCardProps {
  id: string;
  name: string;
  roll_number: string;
  email?: string;
  division: string;
  year: string;
  is_enrolled: boolean;
  onEnroll?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function StudentCard({
  id,
  name,
  roll_number,
  email,
  division,
  year,
  is_enrolled,
  onEnroll,
  onDelete,
}: StudentCardProps) {
  
  const getInitials = (studentName: string) => {
    if (!studentName) return "S";
    return studentName
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      onDelete(id);
    }
  };

  const handleEnroll = () => {
    if (onEnroll) {
      onEnroll(id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow transition-shadow flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        {/* Header section with Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-teal-700 flex flex-shrink-0 items-center justify-center text-white font-bold text-lg shadow-sm">
              {getInitials(name)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight truncate max-w-[160px]" title={name}>
                {name}
              </h3>
              <p className="text-sm font-mono text-gray-500 mt-0.5">{roll_number}</p>
            </div>
          </div>
          
          <div>
            {is_enrolled ? (
              <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 uppercase tracking-wider">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Enrolled
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wider">
                Not Enrolled
              </span>
            )}
          </div>
        </div>

        {/* Email */}
        {email && (
          <div className="flex items-center text-sm text-gray-500 mb-4 h-5 truncate" title={email}>
            <svg className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{email}</span>
          </div>
        )}

        {/* Badges Div + Year */}
        <div className="flex space-x-2 mb-6">
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-200">
            Year: {year}
          </span>
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-200">
            Div: {division}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <button
          onClick={handleEnroll}
          className="text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 hover:text-teal-800 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 font-medium rounded-md text-xs px-3 py-1.5 transition-colors focus:outline-none"
        >
          {is_enrolled ? "Re-enroll Face" : "Enroll Face"}
        </button>
        
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-800 hover:bg-red-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-medium rounded-md text-xs px-3 py-1.5 transition-colors focus:outline-none"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
