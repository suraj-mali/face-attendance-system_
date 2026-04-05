"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface StudentReport {
  name: string;
  roll_number: string;
  total_classes: number;
  present: number;
  percentage: number;
}

interface ReportData {
  course_name: string;
  course_code: string;
  total_sessions: number;
  students: StudentReport[];
}

export default function ReportsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("faculty_token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
        if (res.data.length > 0) setCourseId(res.data[0].id);
      } catch (err) {
        console.error("Failed to load courses");
      }
    };
    fetchCourses();
  }, []);

  const handleGenerateReport = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const token = localStorage.getItem("faculty_token");
      let url = `${process.env.NEXT_PUBLIC_API_URL}/reports/attendance?course_id=${courseId}`;
      if (fromDate) url += `&from_date=${fromDate}`;
      if (toDate) url += `&to_date=${toDate}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReportData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!courseId) return;
    try {
      setExporting(true);
      const token = localStorage.getItem("faculty_token");
      
      let url = `${process.env.NEXT_PUBLIC_API_URL}/reports/export?course_id=${courseId}`;
      if (fromDate) url += `&from_date=${fromDate}`;
      if (toDate) url += `&to_date=${toDate}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob", // Important for receiving binary data
      });

      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `attendance_report_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      if (link.parentNode) link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Failed to export Excel file.");
    } finally {
      setExporting(false);
    }
  };

  // Calculations
  const averagePercentage = reportData?.students.length
    ? Math.round(reportData.students.reduce((acc, s) => acc + s.percentage, 0) / reportData.students.length)
    : 0;

  const shortageCount = reportData?.students.filter((s) => s.percentage < 75).length || 0;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate analytics and export academic records.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 shrink-0 z-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date (Optional)</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date (Optional)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-500"
            />
          </div>
          <div>
            <button
              onClick={handleGenerateReport}
              disabled={!courseId || loading}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 mb-6 shrink-0">
          {error}
        </div>
      )}

      {reportData && (
        <div className="flex flex-col flex-1 min-h-0 z-10 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                    {reportData.course_code}: {reportData.course_name}
                </h2>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {exporting ? "Downloading..." : "Download Excel"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Classes</p>
                        <p className="text-2xl font-bold text-gray-900">{reportData.total_sessions}</p>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Average Class %</p>
                        <p className="text-2xl font-bold text-gray-900">{averagePercentage}%</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Defaulters (&lt; 75%)</p>
                        <p className="text-2xl font-bold text-red-600">{shortageCount} <span className="text-sm font-normal text-gray-400">students</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 shrink-0 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.students} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="roll_number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip 
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {reportData.students.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Present</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">%</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 text-sm">
                            {reportData.students.map((student) => (
                                <tr key={student.roll_number} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900 border-l-4 border-transparent">
                                        {student.roll_number}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                                        {student.name}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-center text-gray-900">
                                        {student.present}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-center text-gray-500">
                                        {student.total_classes}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-center font-bold">
                                        <span className={student.percentage >= 75 ? "text-green-600" : "text-red-500"}>
                                            {student.percentage}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                        {student.percentage >= 75 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                Regular
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                Shortage
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reportData.students.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No student records found for the selected criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
