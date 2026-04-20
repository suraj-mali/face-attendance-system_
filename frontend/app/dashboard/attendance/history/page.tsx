"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface AttendanceHistory {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  session_date: string;
  started_at: string;
  ended_at: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  name: string;
  roll_number: string;
  is_present: boolean;
  confidence_score: number | null;
  marked_at: string;
  marked_by: string;
}

export default function AttendanceHistoryPage() {
  const [history, setHistory] = useState<AttendanceHistory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination Support (Basic Local or via API)
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [totalRecords, setTotalRecords] = useState(0);

  // Inline Panel State
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [recordsCache, setRecordsCache] = useState<Record<string, AttendanceRecord[]>>({});

  useEffect(() => {
    const initData = async () => {
      try {
        const token = localStorage.getItem("faculty_token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to load courses dropdown");
      }
    };
    initData();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('faculty_token');
      let url = process.env.NEXT_PUBLIC_API_URL + '/attendance/history';
      if (selectedCourse) {
        url += `?course_id=${selectedCourse}`;
      }
      
      const res = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('History fetch error:', res.status, err);
        throw new Error(err.detail || 'Failed to fetch attendance history records.');
      }
      
      const data = await res.json();
      console.log('History data:', data);
      setHistory(data.sessions || data || []);
      setTotalRecords(data.total || (data.sessions ? data.sessions.length : (data.length || 0)));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance history records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCourse]);

  const toggleRow = async (sessionId: string) => {
    if (expandedRow === sessionId) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(sessionId);

    if (!recordsCache[sessionId]) {
      setExpandedLoading(true);
      try {
        const token = localStorage.getItem("faculty_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/attendance/session/${sessionId}/records`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const data = await res.json();
        
        const records = data.records || [];
        // Sort: Absent first, then alphabetical (if we want to keep some sorting)
        const sorted = records.sort((a: AttendanceRecord, b: AttendanceRecord) => {
          if (a.is_present === b.is_present) {
            return a.roll_number.localeCompare(b.roll_number);
          }
          return a.is_present ? 1 : -1;
        });
        setRecordsCache((prev) => ({ ...prev, [sessionId]: sorted }));
      } catch (err) {
        alert("Failed to load session records.");
        setExpandedRow(null);
      } finally {
        setExpandedLoading(false);
      }
    }
  };

  const handleCourseFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourse(e.target.value);
    setPage(1);
    setExpandedRow(null);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-100 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
          <p className="text-sm text-gray-500 mt-1">Review past classes and modify records if needed.</p>
        </div>
        <div>
          <select
            value={selectedCourse}
            onChange={handleCourseFilter}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 font-medium min-w-[200px]"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 mb-6 shrink-0">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">P / T</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">%</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Records</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {loading && history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center mb-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                      Loading history...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <p>No attendance sessions found. Take your first attendance!</p>
                    </td>
                  </tr>
                ) : (
                  history.map((session) => {
                    const isExpanded = expandedRow === session.id;

                    return (
                      <React.Fragment key={session.id}>
                        <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 border-l-4 border-transparent">
                            {session.session_date ? new Date(session.session_date).toLocaleDateString('en-IN') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-800">{session.course_name} ({session.course_code})</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-gray-800">
                            {session.present_count} <span className="text-gray-400 font-normal">/ {session.total_students}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                session.attendance_percentage >= 75 ? 'bg-green-100 text-green-800' : 
                                session.attendance_percentage >= 50 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {session.attendance_percentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {session.ended_at ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Ongoing
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => toggleRow(session.id)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end w-full focus:outline-none"
                            >
                              View Records
                              <svg className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expandable Sub-table Row */}
                        {isExpanded && (
                          <tr className="bg-gray-50/80 shadow-inner">
                            <td colSpan={6} className="p-0 border-b border-gray-300">
                                <div className="px-8 py-6 w-full animate-in slide-in-from-top-2 duration-200">
                                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-100/50 flex justify-between items-center text-xs uppercase tracking-wider font-bold text-gray-600">
                                            <span>Detailed Session Roster</span>
                                            {expandedLoading && (
                                                <span className="flex items-center text-blue-600">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Loading...
                                                </span>
                                            )}
                                        </div>
                                        <div className="overflow-y-auto max-h-[300px]">
                                            <table className="min-w-full divide-y divide-gray-100">
                                                <thead className="bg-white sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Name</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Roll No</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Confidence</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Method</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 text-sm bg-white">
                                                    {recordsCache[session.id]?.length === 0 && (
                                                        <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No records found.</td></tr>
                                                    )}
                                                    {recordsCache[session.id]?.map(record => (
                                                        <tr key={record.id} className={`hover:bg-gray-50 border-l-4 ${record.is_present ? 'border-green-500' : 'border-red-500'}`}>
                                                            <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{record.name}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap font-mono text-gray-500">{record.roll_number}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap">
                                                                {record.is_present ? (
                                                                    <span className="font-medium text-green-700">Present</span>
                                                                ) : (
                                                                    <span className="font-medium text-red-700">Absent</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-right">
                                                                {record.confidence_score !== null && record.confidence_score !== undefined ? (
                                                                    <span className="text-xs text-gray-500">{(record.confidence_score * 100).toFixed(1)}%</span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-right text-gray-500 text-xs">
                                                                {record.marked_by === 'face_recognition' ? 'Auto (Face)' : record.marked_by}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6 shrink-0 z-20">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * perPage + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(page * perPage, totalRecords)}</span> 
                  {history.length >= perPage && <span> (Load more available)</span>}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">Previous</span>
                    &larr; Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={history.length < perPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    Next &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
